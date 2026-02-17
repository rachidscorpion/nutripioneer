import crypto from 'crypto';

const ALG = 'HS256';
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

function getSecret(): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error('BETTER_AUTH_SECRET is not set');
    return secret;
}

function base64url(buffer: Buffer): string {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64urlDecode(str: string): string {
    const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString();
}

export interface AdminTokenPayload {
    email: string;
    role: 'admin';
    iat: number;
    exp: number;
}

export function signAdminToken(email: string): string {
    const secret = getSecret();
    const now = Math.floor(Date.now() / 1000);

    const header = { alg: ALG, typ: 'JWT' };
    const payload: AdminTokenPayload = {
        email,
        role: 'admin',
        iat: now,
        exp: now + TOKEN_EXPIRY_SECONDS,
    };

    const encodedHeader = base64url(Buffer.from(JSON.stringify(header)));
    const encodedPayload = base64url(Buffer.from(JSON.stringify(payload)));
    const signature = base64url(
        crypto.createHmac('sha256', secret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest()
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token: string): AdminTokenPayload {
    const secret = getSecret();
    const parts = token.split('.');

    if (parts.length !== 3) {
        throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    const expectedSignature = base64url(
        crypto.createHmac('sha256', secret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest()
    );

    if (signature !== expectedSignature) {
        throw new Error('Invalid token signature');
    }

    const payload: AdminTokenPayload = JSON.parse(base64urlDecode(encodedPayload));

    if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
    }

    if (payload.role !== 'admin') {
        throw new Error('Not an admin token');
    }

    return payload;
}
