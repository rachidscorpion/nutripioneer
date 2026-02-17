import type { Context, Next } from 'hono';
import { verifyAdminToken } from '@/lib/admin-auth';

export async function adminMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
            success: false,
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header',
        }, 401);
    }

    const token = authHeader.slice(7);

    try {
        const payload = verifyAdminToken(token);
        c.set('adminEmail', payload.email);
        await next();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        return c.json({
            success: false,
            error: 'Unauthorized',
            message,
        }, 401);
    }
}
