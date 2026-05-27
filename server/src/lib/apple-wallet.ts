/**
 * Apple Wallet — Sunrise Sunset Pass
 *
 * Generates .pkpass storeCard passes for studio memberships, registers
 * device push tokens, and sends APNs notifications when the pass changes.
 *
 * Visual: single sunset hero strip (matches the web app's `.bg-sunset`),
 * cream surface, chocolate body type, rose label tone. The plan name
 * appears as a header badge; the member's first name overlays the strip.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import jwt from 'jsonwebtoken';
import * as http2 from 'node:http2';
import { PKPass } from 'passkit-generator';
import { query, queryOne } from '../config/database.js';

console.log('[APPLE WALLET] Modulo inicializado');

const APPLE_AUTH_TOKEN = process.env.APPLE_AUTH_TOKEN;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_APNS_KEY_BASE64 = process.env.APPLE_APNS_KEY_BASE64;
// Hardcodeado a "Sunrise Sunset" para que NUNCA herede valor de otro
// proyecto que use el mismo PassTypeID si por error se configura
// APPLE_ORG_NAME en Railway con un valor distinto.
const APPLE_ORG_NAME = 'Sunrise Sunset';

// Studio location — El Tezal, Cabo San Lucas, Baja California Sur.
// MST year-round, no DST → fixed `-07:00` offset for any ISO timestamps
// the pass emits (relevantDate, etc.).
const STUDIO_LAT = 22.8755;
const STUDIO_LNG = -109.9120;
const STUDIO_TZ_OFFSET = '-07:00';

// Pass color scheme — cream surface + chocolate body + rose label.
// The sunset strip supplies all the warmth; everything else stays calm.
const PASS_STYLE = {
    backgroundColor: 'rgb(239, 231, 217)',   // #EFE7D9 cream
    foregroundColor: 'rgb(110, 69, 40)',     // #6E4528 chocolate
    labelColor: 'rgb(199, 126, 111)',        // #C67E6F rose
};

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
    return raw.toUpperCase().slice(0, 22);
}

function firstName(fullName: string | null | undefined): string {
    return (fullName || 'Miembro').split(/\s+/)[0];
}

function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatClassesRemaining(classes: number | null): string {
    if (classes === null || classes === -1) return 'ILIMITADAS';
    if (classes === 0) return 'Sin créditos';
    if (classes === 1) return '1 clase';
    return `${classes} clases`;
}

// Parse our own ISO strings (YYYY-MM-DDTHH:MM:00-07:00) without going through
// JS Date timezone math — we want the wall-clock components as written.
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

function getValidDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null;
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export async function getMembershipData(membershipId: string): Promise<MembershipData | null> {
    try {
        // Keep the requested membership as serial, but display the user's
        // current wallet summary (sum of all active memberships' credits).
        const membership = await queryOne<MembershipData>(`
            SELECT m.id, m.user_id, m.plan_id,
                COALESCE((
                    SELECT p2.name FROM memberships m2 JOIN plans p2 ON m2.plan_id = p2.id
                    WHERE m2.user_id = m.user_id AND m2.status = 'active'
                    ORDER BY m2.created_at DESC LIMIT 1
                ), p.name) as plan_name,
                p.features as plan_features,
                u.display_name as user_name, u.email as user_email, u.phone as user_phone,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM memberships m2
                        JOIN plans p2 ON m2.plan_id = p2.id
                        WHERE m2.user_id = m.user_id
                          AND m2.status = 'active'
                          AND (m2.classes_remaining IS NULL OR p2.class_limit IS NULL)
                    ) THEN NULL
                    ELSE COALESCE((
                        SELECT SUM(GREATEST(COALESCE(m2.classes_remaining, 0), 0))
                        FROM memberships m2
                        WHERE m2.user_id = m.user_id AND m2.status = 'active'
                    ), 0)::int
                END as classes_remaining,
                COALESCE((SELECT COUNT(*) FROM bookings b WHERE b.user_id = m.user_id AND b.status = 'checked_in'), 0)::int as classes_used,
                COALESCE(u.loyalty_points, 0)::int as loyalty_points,
                COALESCE((
                    SELECT MIN(m4.start_date) FROM memberships m4
                    WHERE m4.user_id = m.user_id AND m4.status = 'active'
                ), m.start_date) as start_date,
                COALESCE((
                    SELECT MAX(m3.end_date) FROM memberships m3
                    WHERE m3.user_id = m.user_id AND m3.status = 'active'
                ), m.end_date) as end_date,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM memberships ma
                        WHERE ma.user_id = m.user_id AND ma.status = 'active'
                    ) THEN 'active'
                    ELSE m.status
                END as status,
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
            WHERE m.id = $1`, [membershipId]);

        if (membership) {
            const nextEvent = await queryOne<{
                title: string; date: string; start_time: string; location: string;
            }>(`
                SELECT e.title, e.date::text, e.start_time::text, e.location
                FROM event_registrations r
                JOIN events e ON r.event_id = e.id
                WHERE r.user_id = $1 AND r.status = 'confirmed'
                  AND e.date >= CURRENT_DATE AND e.status = 'published'
                ORDER BY e.date ASC, e.start_time ASC
                LIMIT 1
            `, [membership.user_id]);
            membership.next_event = nextEvent || null;
        }

        return membership;
    } catch (error) {
        console.error('[APPLE] Error obteniendo membresia:', error);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Device registration (unchanged — works against apple_wallet_devices table)
// ---------------------------------------------------------------------------

export async function registerDevice(deviceId: string, pushToken: string, passTypeId: string, membershipId: string): Promise<void> {
    await query('INSERT INTO apple_wallet_devices (device_id, push_token, pass_type_id, membership_id) VALUES ($1, $2, $3, $4) ON CONFLICT (device_id, pass_type_id, membership_id) DO UPDATE SET push_token = $2, updated_at = NOW()', [deviceId, pushToken, passTypeId, membershipId]);
}

export async function unregisterDevice(deviceId: string, passTypeId: string, membershipId: string): Promise<void> {
    await query('DELETE FROM apple_wallet_devices WHERE device_id = $1 AND pass_type_id = $2 AND membership_id = $3', [deviceId, passTypeId, membershipId]);
}

export async function getDevicesForMembership(membershipId: string): Promise<Array<{ device_id: string; push_token: string }>> {
    return await query<{ device_id: string; push_token: string }>('SELECT device_id, push_token FROM apple_wallet_devices WHERE membership_id = $1', [membershipId]);
}

export async function getSerialsForDevice(deviceId: string, passTypeId: string): Promise<Array<{ serial_number: string; last_updated: string }>> {
    const devices = await query<{ membership_id: string; updated_at: Date }>('SELECT membership_id, updated_at FROM apple_wallet_devices WHERE device_id = $1 AND pass_type_id = $2', [deviceId, passTypeId]);
    return devices.map((d) => ({ serial_number: d.membership_id, last_updated: d.updated_at.toISOString() }));
}

export async function recordPassUpdate(membershipId: string, classesOld: number | null, classesNew: number | null): Promise<void> {
    await query('INSERT INTO apple_wallet_updates (membership_id, classes_old, classes_new) VALUES ($1, $2, $3)', [membershipId, classesOld, classesNew]);
}

export async function getLastUpdate(membershipId: string): Promise<{ updated_at: Date } | null> {
    return await queryOne<{ updated_at: Date }>('SELECT updated_at FROM apple_wallet_updates WHERE membership_id = $1 ORDER BY updated_at DESC LIMIT 1', [membershipId]);
}

export async function getUpdatedPassesSince(deviceId: string, passTypeId: string, lastUpdated: Date): Promise<string[]> {
    // Subtract 2 seconds to avoid race conditions
    const adjustedDate = new Date(lastUpdated.getTime() - 2000);
    const result = await query<{ membership_id: string }>(
        `SELECT DISTINCT awu.membership_id
         FROM apple_wallet_updates awu
         JOIN apple_wallet_devices awd ON awu.membership_id = awd.membership_id
         WHERE awd.device_id = $1 AND awd.pass_type_id = $2 AND awu.updated_at > $3`,
        [deviceId, passTypeId, adjustedDate]
    );
    return result.map(r => r.membership_id);
}

// ---------------------------------------------------------------------------
// APNs push (unchanged)
// ---------------------------------------------------------------------------

function getAPNsConfig() {
    if (!APPLE_KEY_ID || !APPLE_TEAM_ID || !APPLE_APNS_KEY_BASE64) throw new Error('Faltan credenciales APNs');
    return { keyId: APPLE_KEY_ID, teamId: APPLE_TEAM_ID, key: Buffer.from(APPLE_APNS_KEY_BASE64, 'base64').toString('utf8') };
}

function generateAPNsToken(): string {
    const config = getAPNsConfig();
    return jwt.sign({ iss: config.teamId, iat: Math.floor(Date.now() / 1000) }, config.key, { algorithm: 'ES256', header: { alg: 'ES256', kid: config.keyId } });
}

export async function sendAPNsPushNotification(pushToken: string): Promise<boolean> {
    try {
        const token = generateAPNsToken();
        const client = http2.connect('https://api.push.apple.com:443');
        return new Promise((resolve) => {
            client.on('error', (err) => { console.error('[APNs Silent] Connection error:', err.message); client.close(); resolve(false); });
            const req = client.request({ ':method': 'POST', ':path': '/3/device/' + pushToken, authorization: 'bearer ' + token, 'apns-topic': APPLE_PASS_TYPE_ID, 'apns-push-type': 'background', 'apns-priority': '5' });
            req.on('response', (headers) => {
                let responseBody = '';
                req.on('data', (chunk: Buffer) => { responseBody += chunk.toString(); });
                req.on('end', () => {
                    const status = headers[':status'];
                    console.log(`[APNs Silent] Status: ${status}, Response: ${responseBody || 'empty'}`);
                    client.close();
                    resolve(status === 200);
                });
            });
            req.on('error', (err) => { console.error('[APNs Silent] Request error:', err.message); client.close(); resolve(false); });
            req.end(JSON.stringify({}));
        });
    } catch (error) { console.error('[APNs Silent] Error:', error); return false; }
}

export async function sendAPNsAlertNotification(pushToken: string, title: string, body: string): Promise<boolean> {
    try {
        const token = generateAPNsToken();
        const payload = JSON.stringify({ aps: { alert: { title, body }, sound: 'default' } });
        const client = http2.connect('https://api.push.apple.com:443');
        return new Promise((resolve) => {
            client.on('error', (err) => { console.error('[APNs Alert] Connection error:', err.message); client.close(); resolve(false); });
            const req = client.request({
                ':method': 'POST',
                ':path': '/3/device/' + pushToken,
                authorization: 'bearer ' + token,
                'apns-topic': APPLE_PASS_TYPE_ID,
                'apns-push-type': 'alert',
                'apns-priority': '10',
                'content-type': 'application/json'
            });
            req.on('response', (headers) => {
                let responseBody = '';
                req.on('data', (chunk: Buffer) => { responseBody += chunk.toString(); });
                req.on('end', () => {
                    const status = headers[':status'];
                    console.log(`[APNs Alert] Status: ${status}, Response: ${responseBody || 'empty'}, Token: ${pushToken.substring(0, 20)}...`);
                    client.close();
                    resolve(status === 200);
                });
            });
            req.on('error', (err) => { console.error('[APNs Alert] Request error:', err.message); client.close(); resolve(false); });
            req.end(payload);
        });
    } catch (error) {
        console.error('[APNs Alert] Error:', error);
        return false;
    }
}

export async function notifyAllDevices(membershipId: string, title?: string, message?: string): Promise<number> {
    const devices = await getDevicesForMembership(membershipId);
    let count = 0;
    for (const d of devices) {
        const silentOk = await sendAPNsPushNotification(d.push_token);
        if (title && message) {
            await sendAPNsAlertNotification(d.push_token, title, message);
        }
        if (silentOk) count++;
    }
    return count;
}

export async function notifyAllUserDevices(userId: string, title?: string, message?: string): Promise<number> {
    const devices = await query<{ push_token: string; membership_id: string }>(
        `SELECT DISTINCT awd.push_token, awd.membership_id
         FROM apple_wallet_devices awd
         JOIN memberships m ON awd.membership_id = m.id
         WHERE m.user_id = $1`, [userId]
    );
    let count = 0;
    for (const d of devices) {
        await recordPassUpdate(d.membership_id, null, null);
        const silentOk = await sendAPNsPushNotification(d.push_token);
        if (title && message) {
            await sendAPNsAlertNotification(d.push_token, title, message);
        }
        if (silentOk) count++;
    }
    return count;
}

export async function sendAlertToAllDevices(title: string, message: string): Promise<number> {
    const devices = await query<{ push_token: string }>('SELECT DISTINCT push_token FROM apple_wallet_devices');
    let count = 0;
    for (const d of devices) {
        const ok = await sendAPNsAlertNotification(d.push_token, title, message);
        if (ok) count++;
        if (devices.length > 10) await new Promise(r => setTimeout(r, 100));
    }
    console.log(`[APNs] Alert sent to ${count}/${devices.length} devices`);
    return count;
}

export function verifyAuthToken(authHeader: string | undefined, serial?: string): boolean {
    if (!authHeader || !authHeader.startsWith('ApplePass ')) return false;
    const token = authHeader.substring('ApplePass '.length).trim();
    if (APPLE_AUTH_TOKEN && token === APPLE_AUTH_TOKEN) return true;
    if (serial && token === serial) return true;
    return false;
}

// ---------------------------------------------------------------------------
// Pass model builder
// ---------------------------------------------------------------------------

function readPemFile(filePath: string): string {
    const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) throw new Error('No existe: ' + absPath);
    const raw = fs.readFileSync(absPath, 'utf8').trim();
    const match = raw.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/);
    return match ? match[0].trim() : raw;
}

function buildTempModelDir(m: MembershipData): string {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sunrise-pass-'));
    const dir = base + '.pass';
    fs.mkdirSync(dir, { recursive: true });
    let baseUrl = process.env.BASE_URL || 'https://sunrise-api-production.up.railway.app';
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    const frontendUrl = process.env.FRONTEND_URL || 'https://sunrise-web-production.up.railway.app';

    const endDate = getValidDate(m.end_date);
    const hasFutureEndDate = Boolean(endDate && endDate.getTime() > Date.now());

    const passJson = {
        formatVersion: 1,
        passTypeIdentifier: APPLE_PASS_TYPE_ID,
        teamIdentifier: APPLE_TEAM_ID,
        serialNumber: m.id,
        webServiceURL: baseUrl + '/api/wallet',
        authenticationToken: APPLE_AUTH_TOKEN || m.id,
        organizationName: APPLE_ORG_NAME,
        description: `Pase ${m.plan_name} · Sunrise Sunset`,
        logoText: 'Sunrise Sunset',
        storeCard: {
            // Header — plan badge, top-right of the logo bar
            headerFields: [
                { key: 'plan', label: 'PLAN', value: planBadge(m.plan_name) }
            ],
            // Primary — first name overlays the sunset strip
            primaryFields: [
                { key: 'member', value: firstName(m.user_name) }
            ],
            // Secondary — three quick-glance fields below the strip
            secondaryFields: [
                {
                    key: 'classes',
                    label: 'CRÉDITOS',
                    value: formatClassesRemaining(m.classes_remaining),
                    changeMessage: 'Sunrise Sunset · %@ ☀️',
                },
                {
                    key: 'valid_until',
                    label: 'VENCE',
                    value: formatDate(endDate),
                },
                ...(m.next_class_date ? [{
                    key: 'next',
                    label: 'PRÓXIMA',
                    value: formatNextClass(m.next_class_date),
                }] : []),
            ],
            // Auxiliary — supporting context
            auxiliaryFields: [
                ...(m.next_class_type ? [{
                    key: 'type',
                    label: 'TIPO',
                    value: m.next_class_type,
                }] : []),
                {
                    key: 'points',
                    label: 'PUNTOS',
                    value: `${m.loyalty_points} pts`,
                },
            ],
            // Back — editorial copy + studio info + terms
            backFields: [
                {
                    key: 'about',
                    label: 'Tu pase Sunrise Sunset',
                    value: 'Llévalo siempre contigo. Se actualiza solo con tus créditos y tu próxima clase.',
                },
                ...(m.next_event ? [{
                    key: 'event',
                    label: 'Próximo evento',
                    value: `${m.next_event.title}\n${formatDate(m.next_event.date)} · ${m.next_event.start_time.substring(0, 5)}\n${m.next_event.location}`,
                }] : []),
                {
                    key: 'studio',
                    label: 'Estudio',
                    value: 'Sunrise Sunset\nEl Tezal, Cabo San Lucas\nBaja California Sur, México',
                },
                {
                    key: 'book',
                    label: 'Reservar clase',
                    value: `${frontendUrl}/app/book`,
                },
                {
                    key: 'wallet',
                    label: 'Mi cuenta',
                    value: `${frontendUrl}/app/wallet`,
                },
                ...(m.referral_code ? [{
                    key: 'referral',
                    label: 'Código de referido',
                    value: `${m.referral_code}\nCompártelo y gana puntos cuando alguien se inscribe.`,
                }] : []),
                {
                    key: 'member_since',
                    label: 'Miembro desde',
                    value: formatDate(m.member_since),
                },
                {
                    key: 'classes_used',
                    label: 'Clases tomadas',
                    value: `${m.classes_used}`,
                },
                {
                    key: 'terms',
                    label: 'Términos',
                    value: 'Pase personal e intransferible.\nCancela mínimo 5 horas antes de tu clase.\nMáximo 2 cancelaciones por membresía.\nHora Los Cabos (GMT-7).',
                },
            ],
        },
        backgroundColor: PASS_STYLE.backgroundColor,
        foregroundColor: PASS_STYLE.foregroundColor,
        labelColor: PASS_STYLE.labelColor,
        barcodes: [{
            format: 'PKBarcodeFormatQR',
            message: m.id,
            messageEncoding: 'iso-8859-1',
            altText: m.id.substring(0, 8).toUpperCase(),
        }],
        expirationDate: hasFutureEndDate
            ? new Date(endDate!.getTime() + 86400000).toISOString()
            : undefined,
        // relevantDate — makes the pass surface on lockscreen near class time
        ...(() => {
            let eventDateStr: string | null = null;
            if (m.next_event) {
                const timeParts = m.next_event.start_time.split(':');
                const normalizedTime = `${timeParts[0]}:${timeParts[1] || '00'}`;
                eventDateStr = `${m.next_event.date}T${normalizedTime}:00${STUDIO_TZ_OFFSET}`;
            }
            const relevantDateStr = [m.next_class_date, eventDateStr]
                .filter(Boolean)
                .sort()[0] || null;
            return relevantDateStr ? { relevantDate: relevantDateStr } : {};
        })(),
        // Location — pass surfaces on lockscreen when near the studio.
        locations: [
            {
                latitude: STUDIO_LAT,
                longitude: STUDIO_LNG,
                relevantText: '☀️ Estás cerca del estudio · Sunrise Sunset',
            },
        ],
    };

    fs.writeFileSync(path.join(dir, 'pass.json'), JSON.stringify(passJson, null, 2));

    // Copy the asset files. Single sunset strip (no level system) + cream
    // icon + transparent wordmark logo, all generated by
    // scripts/build-wallet-assets.mjs.
    const assetsDir = path.resolve(process.cwd(), 'wallet-assets');
    const requiredAssets = [
        'icon.png', 'icon@2x.png', 'icon@3x.png',
        'logo.png', 'logo@2x.png', 'logo@3x.png',
        'strip.png', 'strip@2x.png', 'strip@3x.png',
    ];
    for (const file of requiredAssets) {
        const src = path.join(assetsDir, file);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, file));
    }

    console.log('[APPLE] Modelo: ' + dir);
    return dir;
}

export async function buildApplePassBuffer(membershipId: string): Promise<Buffer> {
    console.log('[APPLE] Generando pase para:', membershipId);
    const m = await getMembershipData(membershipId);
    if (!m) throw new Error('Membresia no encontrada: ' + membershipId);
    if (!WALLET_ELIGIBLE_STATUSES.has(m.status)) throw new Error('Membresia no elegible para wallet: ' + m.status);
    if (!APPLE_TEAM_ID || !APPLE_PASS_TYPE_ID) throw new Error('Faltan APPLE_TEAM_ID o APPLE_PASS_TYPE_ID');
    const assetsDir = path.resolve(process.cwd(), 'wallet-assets');
    const certPath = process.env.APPLE_PASS_CERT || path.join(assetsDir, 'pass.pem');
    const keyPath = process.env.APPLE_PASS_KEY || path.join(assetsDir, 'pass.key');
    const wwdrPath = process.env.APPLE_WWDR || path.join(assetsDir, 'wwdr.pem');
    const signerCert = readPemFile(certPath);
    const signerKey = fs.readFileSync(path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath), 'utf8');
    const wwdr = readPemFile(wwdrPath);
    const modelDir = buildTempModelDir(m);
    const buffers: { [key: string]: Buffer } = {};
    for (const file of fs.readdirSync(modelDir)) {
        const fp = path.join(modelDir, file);
        if (fs.statSync(fp).isFile()) buffers[file] = fs.readFileSync(fp);
    }
    const passJsonData = JSON.parse(buffers['pass.json'].toString('utf8'));
    const pass = new PKPass(buffers, { wwdr, signerCert, signerKey, signerKeyPassphrase: process.env.APPLE_CERT_PASSWORD || undefined }, {
        serialNumber: m.id,
        passTypeIdentifier: APPLE_PASS_TYPE_ID,
        teamIdentifier: APPLE_TEAM_ID,
        organizationName: APPLE_ORG_NAME,
        description: passJsonData.description,
        backgroundColor: passJsonData.backgroundColor,
        foregroundColor: passJsonData.foregroundColor,
        labelColor: passJsonData.labelColor,
        webServiceURL: passJsonData.webServiceURL,
        authenticationToken: passJsonData.authenticationToken,
    });
    if (!pass.type) {
        pass.type = 'storeCard';
        const sc = passJsonData.storeCard;
        if (sc.headerFields) pass.headerFields.push(...sc.headerFields);
        if (sc.primaryFields) pass.primaryFields.push(...sc.primaryFields);
        if (sc.secondaryFields) pass.secondaryFields.push(...sc.secondaryFields);
        if (sc.auxiliaryFields) pass.auxiliaryFields.push(...sc.auxiliaryFields);
        if (sc.backFields) pass.backFields.push(...sc.backFields);
    }
    if (passJsonData.barcodes) pass.setBarcodes(...passJsonData.barcodes);
    if (passJsonData.expirationDate) pass.setExpirationDate(new Date(passJsonData.expirationDate));
    const buffer = pass.getAsBuffer();
    try { fs.rmSync(modelDir, { recursive: true, force: true }); } catch (e) { }
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error('El .pkpass resulto vacio');
    console.log('[APPLE] Pase generado (' + buffer.length + ' bytes) para: ' + m.user_name);
    return buffer;
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

export async function onClassAttended(membershipId: string): Promise<void> {
    const m = await getMembershipData(membershipId);
    if (m) {
        await notifyAllUserDevices(m.user_id, '☀️ ¡Clase completada!', `Ganaste 1 punto. Total: ${m.loyalty_points} pts`);
    }
}

export async function onPointsEarned(membershipId: string, points?: number): Promise<void> {
    const m = await getMembershipData(membershipId);
    if (m) {
        await notifyAllUserDevices(m.user_id, '⭐ ¡Puntos actualizados!', `Ahora tienes ${m.loyalty_points} pts`);
    }
}

export async function onMembershipRenewed(membershipId: string): Promise<void> {
    const m = await getMembershipData(membershipId);
    if (m) {
        await notifyAllUserDevices(m.user_id, '🎉 ¡Membresía activada!', `${m.plan_name} · ${formatClassesRemaining(m.classes_remaining)}`);
    } else {
        await recordPassUpdate(membershipId, null, null);
        await notifyAllDevices(membershipId, '🎉 ¡Membresía activada!', 'Tu pase se actualizó');
    }
}

export async function checkAppleWalletConfig(): Promise<{
    configured: boolean;
    teamId: string | null;
    passTypeId: string | null;
    hasAuthToken: boolean;
    hasAPNsKey: boolean;
    hasKeyId: boolean;
    hasCertificates: boolean;
    canSendPush: boolean;
    error?: string;
}> {
    const result = {
        configured: false,
        teamId: null as string | null,
        passTypeId: null as string | null,
        hasAuthToken: false,
        hasAPNsKey: false,
        hasKeyId: false,
        hasCertificates: false,
        canSendPush: false,
        error: undefined as string | undefined,
    };
    try {
        result.teamId = APPLE_TEAM_ID || null;
        result.passTypeId = APPLE_PASS_TYPE_ID || null;
        result.hasAuthToken = !!APPLE_AUTH_TOKEN;
        result.hasAPNsKey = !!APPLE_APNS_KEY_BASE64;
        result.hasKeyId = !!APPLE_KEY_ID;
        const assetsDir = path.resolve(process.cwd(), 'wallet-assets');
        result.hasCertificates = fs.existsSync(path.join(assetsDir, 'pass.pem'))
            && fs.existsSync(path.join(assetsDir, 'pass.key'))
            && fs.existsSync(path.join(assetsDir, 'wwdr.pem'));
        result.configured = !!(result.teamId && result.passTypeId && result.hasAuthToken && result.hasCertificates);
        result.canSendPush = !!(result.teamId && result.hasAPNsKey && result.hasKeyId);
    } catch (error) {
        result.error = String(error);
    }
    return result;
}

export default {
    getMembershipData,
    buildApplePassBuffer,
    sendAPNsPushNotification,
    sendAPNsAlertNotification,
    registerDevice,
    unregisterDevice,
    getDevicesForMembership,
    getSerialsForDevice,
    notifyAllDevices,
    recordPassUpdate,
    getLastUpdate,
    getUpdatedPassesSince,
    verifyAuthToken,
    onClassAttended,
    onPointsEarned,
    onMembershipRenewed,
    checkAppleWalletConfig,
};
