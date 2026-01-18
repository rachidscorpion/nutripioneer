import { Hono } from 'hono';
import { auth } from '@/lib/auth';

const authRoutes = new Hono();

/**
 * Handle all Better Auth routes
 * This includes:
 * - POST /auth/sign-in/email - Email sign in
 * - POST /auth/sign-up/email - Email sign up
 * - GET /auth/sign-in/social - OAuth sign in redirect
 * - GET /auth/callback/:provider - OAuth callback
 * - POST /auth/sign-out - Sign out
 * - GET /auth/session - Get current session
 * And many more...
 */
authRoutes.all('/*', async (c) => {
    return auth.handler(c.req.raw);
});

// Convenience aliases that map to Better Auth endpoints
// These allow frontend to use /auth/login and /auth/register

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

export default authRoutes;
