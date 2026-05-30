/**
 * Google Wallet — Sunrise Sunset Pass
 *
 * Implements OAuth2 with the issuer service account, creates/updates the
 * single LoyaltyClass (`sunrise_pass_v1`), creates/updates per-membership
 * LoyaltyObjects, and sends in-wallet messages on lifecycle events.
 *
 * Visual: hexBackgroundColor cream, heroImage = sunset gradient (matches
 * the web app's `.bg-sunset`), cream wordmark as programLogo. Plan name
 * shows as the secondaryLoyaltyPoints label; credits remaining is the
 * primary loyaltyPoints value.
 */

import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/database.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MembershipData {
    id: string;
    user_id: string;
    plan_id: string;
    plan_name: string;
    plan_features: string[];
    user_name: string;
    user_email: string;
    user_phone: string;
    classes_remaining: number | null;
    classes_used: number;
    loyalty_points: number;
    start_date: Date | null;
    end_date: Date | null;
    status: string;
    member_since: Date;
    next_class_date: string | null;
    next_class_type: string | null;
    referral_code: string | null;
    next_event?: {
        title: string;
        date: string;
        start_time: string;
        location: string;
    } | null;
}

interface GoogleCredentials {
    issuerId: string;
    email: string;
    privateKey: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GOOGLE_WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const GOOGLE_OAUTH_URL = 'https://oauth2.googleapis.com/token';

// Single class — no per-plan-tier variants. The plan name surfaces as a
// secondary label on the object, the visual treatment stays uniform.
const CLASS_SUFFIX = 'sunrise_pass_v1';

// Studio location — El Tezal, Cabo San Lucas, Baja California Sur.
const STUDIO_LAT = 22.8755;
const STUDIO_LNG = -109.9120;
const STUDIO_TZ_OFFSET = '-07:00';

// Pass color — cream surface so the sunset hero photo carries the warmth.
const PASS_HEX_BG = '#F7EDDE';

const WALLET_ELIGIBLE_STATUSES = new Set([
    'active',
    'pending_activation',
    'pending_payment',
    'paused',
    'expired',
]);

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function planBadge(planName: string | null | undefined): string {
    const raw = (planName || 'Miembro').replace(/[—–·\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return raw.slice(0, 32);
}

function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatClassesRemaining(classes: number | null): string {
    if (classes === null || classes === -1) return 'ILIMITADAS';
    if (classes === 0) return '0';
    return String(classes);
}

function formatNextClass(iso: string | null | undefined): string {
    if (!iso) return '—';
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return '—';
    const [, y, mo, d, hh, mm] = m;
    const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const day = days[date.getUTCDay()];
    const hour = parseInt(hh, 10);
    const min = parseInt(mm, 10);
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMin = min === 0 ? '' : `:${mm}`;
    return `${day} ${displayHour}${displayMin}${period}`;
}

function parseValidDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// ---------------------------------------------------------------------------
// Credential Loading
// ---------------------------------------------------------------------------

let cachedCredentials: GoogleCredentials | null = null;
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function getCredentials(): GoogleCredentials {
    if (cachedCredentials) return cachedCredentials;

    const issuerId = process.env.GOOGLE_ISSUER_ID;
    const email = process.env.GOOGLE_SA_EMAIL;
    let privateKey = process.env.GOOGLE_SA_PRIVATE_KEY;

    if (!issuerId || !email || !privateKey) {
        throw new Error(
            'Missing Google Wallet configuration. Set:\n' +
            '- GOOGLE_ISSUER_ID\n' +
            '- GOOGLE_SA_EMAIL\n' +
            '- GOOGLE_SA_PRIVATE_KEY'
        );
    }

    privateKey = privateKey.replace(/\\n/g, '\n');
    cachedCredentials = { issuerId, email, privateKey };
    return cachedCredentials;
}

// ---------------------------------------------------------------------------
// OAuth2
// ---------------------------------------------------------------------------

export async function getGoogleWalletAccessToken(): Promise<string> {
    if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) {
        return cachedAccessToken.token;
    }

    const creds = getCredentials();
    const now = Math.floor(Date.now() / 1000);

    const assertion = jwt.sign(
        {
            iss: creds.email,
            scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
            aud: GOOGLE_OAUTH_URL,
            iat: now,
            exp: now + 3600,
        },
        creds.privateKey,
        { algorithm: 'RS256' }
    );

    const response = await fetch(GOOGLE_OAUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get Google access token: ${error}`);
    }

    const data = await response.json() as { access_token: string; expires_in: number };

    cachedAccessToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return data.access_token;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getMembershipData(membershipId: string): Promise<MembershipData | null> {
    return await queryOne<MembershipData>(`
        SELECT
            m.id,
            m.user_id,
            m.plan_id,
            p.name as plan_name,
            p.features as plan_features,
            u.display_name as user_name,
            u.email as user_email,
            u.phone as user_phone,
            m.classes_remaining,
            COALESCE((
                SELECT COUNT(*) FROM bookings b
                WHERE b.membership_id = m.id AND b.status = 'checked_in'
            ), 0)::int as classes_used,
            COALESCE(u.loyalty_points, 0)::int as loyalty_points,
            m.start_date,
            m.end_date,
            m.status,
            u.created_at as member_since,
            (SELECT rc.code FROM referral_codes rc WHERE rc.user_id = m.user_id LIMIT 1) as referral_code,
            (SELECT (c.date || 'T' || SUBSTRING(c.start_time::text, 1, 5) || ':00${STUDIO_TZ_OFFSET}')
             FROM bookings b2 JOIN classes c ON b2.class_id = c.id
             WHERE b2.user_id = m.user_id AND b2.status = 'confirmed'
             AND (c.date + c.start_time) > (NOW() AT TIME ZONE 'America/Mazatlan')
             ORDER BY c.date ASC, c.start_time ASC LIMIT 1
            ) as next_class_date,
            (SELECT ct.name FROM bookings b3
             JOIN classes c2 ON b3.class_id = c2.id
             LEFT JOIN class_types ct ON c2.class_type_id = ct.id
             WHERE b3.user_id = m.user_id AND b3.status = 'confirmed'
             AND (c2.date + c2.start_time) > (NOW() AT TIME ZONE 'America/Mazatlan')
             ORDER BY c2.date ASC, c2.start_time ASC LIMIT 1
            ) as next_class_type
        FROM memberships m
        JOIN users u ON m.user_id = u.id
        JOIN plans p ON m.plan_id = p.id
        WHERE m.id = $1
    `, [membershipId]);
}

function getBusinessLocations(): Array<{ latitude: number; longitude: number }> {
    // Hardcodeado a las coordenadas reales de Sunrise Sunset
    // (El Tezal, Cabo San Lucas). Antes leía BUSINESS_LATITUDE/LONGITUDE
    // de env vars que podrían heredar valor de otro proyecto.
    return [{ latitude: STUDIO_LAT, longitude: STUDIO_LNG }];
}

// ---------------------------------------------------------------------------
// Loyalty Class — single class for all Sunrise Sunset passes
// ---------------------------------------------------------------------------

export async function createGoogleLoyaltyClass(): Promise<{ success: boolean; classId: string; error?: string }> {
    try {
        const creds = getCredentials();
        const token = await getGoogleWalletAccessToken();

        const classId = `${creds.issuerId}.${CLASS_SUFFIX}`;
        const frontendUrl = (process.env.FRONTEND_URL || 'https://sunrise-web-production.up.railway.app').replace(/\/$/, '');
        let baseUrl = process.env.BASE_URL || '';
        if (!/^https?:\/\//.test(baseUrl)) {
            baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
                ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
                : 'https://sunrise-api-production-40bb.up.railway.app';
        }

        const logoUrl = `${frontendUrl}/wallet/sunrise-logo.png`;
        const heroUrl = `${frontendUrl}/wallet/sunset-hero.png`;

        const loyaltyClass = {
            id: classId,
            issuerName: 'Sunrise Sunset',
            programName: 'Pase Sunrise Sunset',
            hexBackgroundColor: PASS_HEX_BG,

            programLogo: {
                sourceUri: { uri: logoUrl },
                contentDescription: {
                    defaultValue: { language: 'es', value: 'Sunrise Sunset' },
                },
            },

            heroImage: {
                sourceUri: { uri: heroUrl },
                contentDescription: {
                    defaultValue: { language: 'es', value: 'Atardecer Sunrise Sunset' },
                },
            },

            localizedIssuerName: {
                defaultValue: { language: 'es', value: 'Sunrise Sunset' },
            },

            localizedProgramName: {
                defaultValue: { language: 'es', value: 'Pase Sunrise Sunset' },
            },

            countryCode: 'MX',

            discoverableProgram: {
                merchantSignupInfo: {
                    signupWebsite: { uri: frontendUrl },
                },
                merchantSigninInfo: {
                    signinWebsite: { uri: `${frontendUrl}/login` },
                },
            },

            messages: [
                {
                    header: 'Bienvenida a Sunrise Sunset ☀️',
                    body: 'Estudio boutique en El Tezal. Tu pase se actualiza solo con tus créditos y tu próxima clase.',
                    id: 'welcome_msg_v1',
                },
            ],

            locations: getBusinessLocations(),

            reviewStatus: 'UNDER_REVIEW',
            multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',

            callbackOptions: {
                url: `${baseUrl}/api/wallet/google/callback`,
            },
        };

        // Try create, fall back to update on 409
        let response = await fetch(`${GOOGLE_WALLET_API}/loyaltyClass`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loyaltyClass),
        });

        if (response.status === 409) {
            response = await fetch(`${GOOGLE_WALLET_API}/loyaltyClass/${classId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loyaltyClass),
            });
        }

        if (!response.ok) {
            const error = await response.text();
            console.error('[GOOGLE] Failed to create/update loyalty class:', error);
            return { success: false, classId, error };
        }

        console.log(`[GOOGLE] Loyalty Class ready: ${classId}`);
        return { success: true, classId };

    } catch (error) {
        console.error('[GOOGLE] Error creating Loyalty Class:', error);
        return { success: false, classId: '', error: String(error) };
    }
}

// Kept for backward compat with callers expecting the old multi-class entry
// point. With a single class, this just creates the one.
export async function createAllLoyaltyClasses(): Promise<void> {
    await createGoogleLoyaltyClass();
    console.log('[GOOGLE] Loyalty Class created/updated.');
}

// ---------------------------------------------------------------------------
// Loyalty Object — one per membership
// ---------------------------------------------------------------------------

export async function upsertGoogleLoyaltyObject(membershipId: string): Promise<{ success: boolean; objectId: string; error?: string }> {
    try {
        const creds = getCredentials();
        const token = await getGoogleWalletAccessToken();

        const membership = await getMembershipData(membershipId);
        if (!membership) {
            return { success: false, objectId: '', error: 'Membership not found' };
        }

        const objectId = `${creds.issuerId}.${membership.id}_v1`;
        const classId = `${creds.issuerId}.${CLASS_SUFFIX}`;
        const frontendUrl = (process.env.FRONTEND_URL || 'https://sunrise-web-production.up.railway.app').replace(/\/$/, '');

        const startDate = parseValidDate(membership.start_date);
        const endDate = parseValidDate(membership.end_date);

        const loyaltyObject: Record<string, unknown> = {
            id: objectId,
            classId: classId,
            state: membership.status === 'active' ? 'active' : 'inactive',

            accountId: membership.id,
            accountName: membership.user_name,

            barcode: {
                type: 'QR_CODE',
                value: membership.id,
                alternateText: membership.id.substring(0, 8).toUpperCase(),
            },

            // Primary on-card number — credits remaining (or ILIMITADAS)
            loyaltyPoints: {
                balance: { string: formatClassesRemaining(membership.classes_remaining) },
                label: 'CRÉDITOS',
            },

            // Secondary on-card — plan name
            secondaryLoyaltyPoints: {
                balance: { string: planBadge(membership.plan_name) },
                label: 'PLAN',
            },

            textModulesData: [
                ...(membership.next_class_date ? [{
                    id: 'next_class',
                    header: 'PRÓXIMA CLASE',
                    body: formatNextClass(membership.next_class_date)
                        + (membership.next_class_type ? ` · ${membership.next_class_type}` : ''),
                }] : []),
                {
                    id: 'valid_until',
                    header: 'VENCE',
                    body: formatDate(membership.end_date),
                },
                {
                    id: 'points',
                    header: 'PUNTOS',
                    body: `${membership.loyalty_points} pts`,
                },
                {
                    id: 'classes_used',
                    header: 'CLASES TOMADAS',
                    body: `${membership.classes_used}`,
                },
                {
                    id: 'member_since',
                    header: 'MIEMBRO DESDE',
                    body: formatDate(membership.member_since),
                },
                ...(membership.referral_code ? [{
                    id: 'referral',
                    header: 'CÓDIGO DE REFERIDO',
                    body: `${membership.referral_code} — compártelo y gana puntos`,
                }] : []),
                ...(membership.next_event ? [{
                    id: 'next_event',
                    header: 'PRÓXIMO EVENTO',
                    body: `${membership.next_event.title}\n${formatDate(membership.next_event.date)} · ${membership.next_event.start_time.substring(0, 5)}\n${membership.next_event.location}`,
                }] : []),
                {
                    id: 'studio',
                    header: 'ESTUDIO',
                    body: 'Sunrise Sunset · El Tezal\nCabo San Lucas, BCS',
                },
                {
                    id: 'terms',
                    header: 'TÉRMINOS',
                    body: 'Pase personal e intransferible. Cancela mínimo 5 horas antes. Máximo 2 cancelaciones por membresía. Hora Los Cabos (GMT-7).',
                },
            ],

            linksModuleData: {
                uris: [
                    {
                        uri: `${frontendUrl}/app/book`,
                        description: 'Reservar clase',
                        id: 'book_link',
                    },
                    {
                        uri: `${frontendUrl}/app/wallet`,
                        description: 'Mi cuenta',
                        id: 'wallet_link',
                    },
                    {
                        uri: `${frontendUrl}/app`,
                        description: 'Inicio',
                        id: 'home_link',
                    },
                ],
            },

            locations: getBusinessLocations(),

            hexBackgroundColor: PASS_HEX_BG,
        };

        if (startDate && endDate && endDate.getTime() > Date.now()) {
            loyaltyObject.validTimeInterval = {
                start: { date: startDate.toISOString() },
                end: { date: endDate.toISOString() },
            };
        }

        let response = await fetch(`${GOOGLE_WALLET_API}/loyaltyObject/${objectId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 404) {
            response = await fetch(`${GOOGLE_WALLET_API}/loyaltyObject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loyaltyObject),
            });
        } else {
            response = await fetch(`${GOOGLE_WALLET_API}/loyaltyObject/${objectId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loyaltyObject),
            });
        }

        if (!response.ok) {
            const error = await response.text();
            console.error('[GOOGLE] Failed to upsert loyalty object:', error);
            return { success: false, objectId, error };
        }

        console.log(`[GOOGLE] Loyalty Object upserted: ${objectId}`);
        console.log(`         Member: ${membership.user_name}`);
        console.log(`         Plan: ${membership.plan_name}`);
        console.log(`         Credits: ${formatClassesRemaining(membership.classes_remaining)}`);

        return { success: true, objectId };

    } catch (error) {
        console.error('[GOOGLE] Error upserting Loyalty Object:', error);
        return { success: false, objectId: '', error: String(error) };
    }
}

// ---------------------------------------------------------------------------
// Save URL
// ---------------------------------------------------------------------------

export async function buildGoogleSaveUrl(membershipId: string): Promise<string> {
    const membership = await getMembershipData(membershipId);

    if (!membership) {
        throw new Error(`Membership not found: ${membershipId}`);
    }

    if (!WALLET_ELIGIBLE_STATUSES.has(membership.status)) {
        throw new Error(`Membership is not eligible for wallet: ${membership.status}`);
    }

    // Ensure class exists, then upsert object
    await createGoogleLoyaltyClass();
    await upsertGoogleLoyaltyObject(membershipId);

    const creds = getCredentials();
    const objectId = `${creds.issuerId}.${membership.id}_v1`;
    const frontendUrl = (process.env.FRONTEND_URL || 'https://sunrise-web-production.up.railway.app').replace(/\/$/, '');

    const claims = {
        iss: creds.email,
        aud: 'google',
        origins: [frontendUrl],
        typ: 'savetowallet',
        payload: {
            loyaltyObjects: [{ id: objectId }],
        },
    };

    const token = jwt.sign(claims, creds.privateKey, { algorithm: 'RS256' });
    return `https://pay.google.com/gp/v/save/${token}`;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export async function sendGoogleWalletMessage(params: {
    membershipId: string;
    title: string;
    body: string;
}): Promise<boolean> {
    try {
        const creds = getCredentials();
        const token = await getGoogleWalletAccessToken();
        const objectId = `${creds.issuerId}.${params.membershipId}_v1`;

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const now = new Date();
        const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const message = {
            message: {
                header: params.title,
                body: params.body,
                id: messageId,
                messageType: 'TEXT',
                displayInterval: {
                    start: { date: now.toISOString() },
                    end: { date: end.toISOString() },
                },
            },
        };

        const response = await fetch(
            `${GOOGLE_WALLET_API}/loyaltyObject/${objectId}/addMessage`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('[GOOGLE] Failed to send wallet message:', error);
            return false;
        }

        console.log(`[GOOGLE] Message sent to ${params.membershipId.substring(0, 8)}…`);
        return true;

    } catch (error) {
        console.error('[GOOGLE] Error sending wallet message:', error);
        return false;
    }
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export async function checkGoogleWalletConfig(): Promise<{
    configured: boolean;
    issuerId: string | null;
    email: string | null;
    hasPrivateKey: boolean;
    canAuthenticate: boolean;
    error?: string;
}> {
    const result = {
        configured: false,
        issuerId: null as string | null,
        email: null as string | null,
        hasPrivateKey: false,
        canAuthenticate: false,
        error: undefined as string | undefined,
    };

    try {
        const creds = getCredentials();
        result.issuerId = creds.issuerId;
        result.email = creds.email;
        result.hasPrivateKey = !!creds.privateKey;
        result.configured = true;

        await getGoogleWalletAccessToken();
        result.canAuthenticate = true;

    } catch (error) {
        result.error = String(error);
    }

    return result;
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

export async function onClassAttended(membershipId: string): Promise<void> {
    await upsertGoogleLoyaltyObject(membershipId);
    console.log('[GOOGLE] Pass updated after class attendance.');
}

export async function onPointsEarned(membershipId: string, points: number): Promise<void> {
    await upsertGoogleLoyaltyObject(membershipId);
    await sendGoogleWalletMessage({
        membershipId,
        title: '¡Puntos ganados! ⭐',
        body: `Ganaste ${points} puntos. Sigue acumulando.`,
    });
}

export async function onMembershipRenewed(membershipId: string): Promise<void> {
    await upsertGoogleLoyaltyObject(membershipId);
    await sendGoogleWalletMessage({
        membershipId,
        title: '¡Membresía renovada! 🎉',
        body: 'Tu pase Sunrise Sunset está activo nuevamente.',
    });
}

export async function sendMessageToAllGoogleObjects(title: string, body: string): Promise<number> {
    try {
        const memberships = await query<{ id: string }>(`
            SELECT m.id FROM memberships m WHERE m.status = 'active'
        `);
        let count = 0;
        for (const m of memberships) {
            try {
                await sendGoogleWalletMessage({ membershipId: m.id, title, body });
                count++;
            } catch { /* skip individual failures */ }
            if (memberships.length > 10) await new Promise(r => setTimeout(r, 150));
        }
        console.log(`[GOOGLE] Message sent to ${count}/${memberships.length} objects.`);
        return count;
    } catch (error) {
        console.error('[GOOGLE] sendMessageToAllGoogleObjects error:', error);
        return 0;
    }
}

export default {
    getGoogleWalletAccessToken,
    createGoogleLoyaltyClass,
    createAllLoyaltyClasses,
    upsertGoogleLoyaltyObject,
    buildGoogleSaveUrl,
    sendGoogleWalletMessage,
    sendMessageToAllGoogleObjects,
    checkGoogleWalletConfig,
    onClassAttended,
    onPointsEarned,
    onMembershipRenewed,
};
