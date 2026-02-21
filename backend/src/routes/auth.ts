import { Hono } from 'hono';
import { auth } from '@/lib/auth';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/db/client';
import { randomBytes } from 'crypto';

const authRoutes = new Hono();

// Helper function to generate session token
function generateSessionToken(): string {
    return randomBytes(32).toString('base64url');
}

/**
 * Custom routes - must be defined before the wildcard catch-all
 */

// Convenience aliases that map to Better Auth endpoints
authRoutes.post('/login', async (c) => {
    const body = await c.req.json();

    // Forward to Better Auth's sign-in endpoint
    const url = new URL('/api/auth/sign-in/email', c.req.url);
    const request = new Request(url.toString(), {
        method: 'POST',
        headers: c.req.raw.headers,
        body: JSON.stringify(body),
    });

    return auth.handler(request);
});

authRoutes.post('/register', async (c) => {
    const body = await c.req.json();

    // Forward to Better Auth's sign-up endpoint
    const url = new URL('/api/auth/sign-up/email', c.req.url);
    const request = new Request(url.toString(), {
        method: 'POST',
        headers: c.req.raw.headers,
        body: JSON.stringify(body),
    });

    return auth.handler(request);
});

/**
 * Google Sign-In for React Native (uses ID token directly)
 * This endpoint accepts a Google ID token and creates a session
 */
authRoutes.post('/sign-in/google', async (c) => {
    try {
        const { idToken } = await c.req.json();

        if (!idToken) {
            return c.json({ error: 'ID token is required' }, 400);
        }

        // Verify the Google ID token
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return c.json({ error: 'Invalid ID token' }, 400);
        }

        const googleUserId = payload.sub;
        const email = payload.email;
        const name = payload.name || email.split('@')[0];
        const image = payload.picture;

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    image,
                    emailVerified: true, // Google email is verified
                },
            });
        }

        // Find or create Google account
        const accountId = `google:${googleUserId}`;
        let account = await prisma.account.findUnique({
            where: { id: accountId },
        });

        if (!account) {
            account = await prisma.account.create({
                data: {
                    id: accountId,
                    accountId: googleUserId,
                    providerId: 'google',
                    userId: user.id,
                    idToken,
                    accessToken: null,
                    refreshToken: null,
                    expiresAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        } else {
            // Update the idToken and updatedAt
            await prisma.account.update({
                where: { id: accountId },
                data: { 
                    idToken,
                    updatedAt: new Date(),
                },
            });
        }

        // Create a session
        const sessionToken = generateSessionToken();
        const sessionExpiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000); // 7 days

        const session = await prisma.session.create({
            data: {
                id: sessionToken,
                userId: user.id,
                expiresAt: sessionExpiresAt,
                token: sessionToken,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // Set session cookie
        const cookieName = 'nutripioneer.session_token';
        const cookieValue = sessionToken;
        
        c.header('Set-Cookie', `${cookieName}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);

        return c.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
            },
            session: {
                token: sessionToken,
                expiresAt: sessionExpiresAt,
            },
        });
    } catch (error) {
        console.error('Google sign-in error:', error);
        return c.json({ error: 'Failed to sign in with Google' }, 500);
    }
});

/**
 * Handle all Better Auth routes (wildcard catch-all)
 * This includes:
 * - POST /auth/sign-in/email - Email sign in
 * - POST /auth/sign-up/email - Email sign up
 * - GET /auth/sign-in/social - OAuth sign in redirect
 * - GET /auth/callback/:provider - OAuth callback
 * - POST /auth/sign-out - Sign out
 * - GET /auth/session - Get current session
 * And many more...
 * NOTE: This must come AFTER custom routes
 */
authRoutes.all('/*', async (c) => {
    return auth.handler(c.req.raw);
});

export default authRoutes;
