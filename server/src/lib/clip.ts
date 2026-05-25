// Cliente HTTP para Clip Checkout API.
// Docs: https://developer.clip.mx
//
// Auth (verificado en el getting-started oficial):
//   Authorization: Basic base64(CLIP_API_KEY:CLIP_API_SECRET)
//
// Endpoint Checkout: POST /payment-requests (también responde /v1/checkout)
//
// Uso:
//   const link = await clip.createCheckoutLink({ amountCents, description, reference, ... });
//   redirige al usuario a link.payment_request_url
//
// Webhooks: Clip no firma con HMAC; validamos el origen del postback con un
// secret que va en la URL (CLIP_WEBHOOK_SECRET).

const BASE_URL = process.env.CLIP_BASE_URL || 'https://api.payclip.io';

export class ClipError extends Error {
    constructor(public status: number, message: string, public payload?: unknown) {
        super(message);
        this.name = 'ClipError';
    }
}

function ensureCredentials(): { key: string; secret: string } {
    const key = process.env.CLIP_API_KEY;
    const secret = process.env.CLIP_API_SECRET || process.env.CLIP_MERCHANT_ID; // fallback al merchant_id
    if (!key) {
        throw new ClipError(500, 'CLIP_API_KEY no está configurada');
    }
    if (!secret) {
        throw new ClipError(500, 'CLIP_API_SECRET (o CLIP_MERCHANT_ID como fallback) no está configurada');
    }
    return { key, secret };
}

function basicAuth(): string {
    const { key, secret } = ensureCredentials();
    return 'Basic ' + Buffer.from(`${key}:${secret}`, 'utf8').toString('base64');
}

async function clipFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: basicAuth(),
            ...(init.headers ?? {}),
        },
    });

    const text = await res.text();
    let body: unknown = null;
    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = text;
    }

    if (!res.ok) {
        const msg = (body as any)?.message || (body as any)?.error || `Clip API ${res.status}`;
        throw new ClipError(res.status, String(msg), body);
    }

    return body as T;
}

export interface CreateCheckoutInput {
    amountCents: number;
    currency?: string; // default MXN
    description: string;
    reference: string; // UUID interno
    successUrl: string;
    errorUrl?: string;
    webhookUrl: string;
}

export interface CreateCheckoutResponse {
    payment_request_id: string;
    payment_request_url: string;
    status?: string;
}

export async function createCheckoutLink(input: CreateCheckoutInput): Promise<CreateCheckoutResponse> {
    const body = {
        amount: input.amountCents / 100,
        currency: input.currency || 'MXN',
        purchase_description: input.description.slice(0, 120),
        redirection_url: {
            success: input.successUrl,
            error: input.errorUrl || input.successUrl,
            default: input.successUrl,
        },
        webhook_url: input.webhookUrl,
        metadata: { external_reference: input.reference },
    };

    return clipFetch<CreateCheckoutResponse>('/payment-requests', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function getCheckoutStatus(paymentRequestId: string): Promise<unknown> {
    return clipFetch<unknown>(`/payment-requests/${paymentRequestId}`);
}

export async function getTransaction(receiptNo: string): Promise<unknown> {
    return clipFetch<unknown>(`/transactions/v1/${encodeURIComponent(receiptNo)}`);
}

export async function refundTransaction(receiptNo: string, amountCents: number): Promise<{ refund_id: string; status: string }> {
    return clipFetch<{ refund_id: string; status: string }>('/refunds/v1', {
        method: 'POST',
        body: JSON.stringify({
            receipt_no: receiptNo,
            amount: amountCents / 100,
        }),
    });
}
