import type { Context, Next } from 'hono';
import { auth } from '@/lib/auth';
import prisma from '@/db/client';

/**
 * Auth middleware that validates session and attaches userId to context
 * Use this middleware on routes that require authentication
 */
export async function authMiddleware(c: Context, next: Next) {
    try {
        let session: any = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        // Fallback for custom mobile session tokens
        if (!session) {
            const authHeader = c.req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const dbSession = await prisma.session.findFirst({
                    where: { token },
                    include: { user: true }
                });

                if (dbSession && dbSession.expiresAt > new Date()) {
                    // Reconstruct session object to match Better Auth's expected format
                    const { user, ...sessionData } = dbSession;
                    session = {
                        session: sessionData,
                        user: user
                    };
                }
            }
        }

        if (!session) {
            return c.json(
                {
                    success: false,
                    error: 'Unauthorized',
                    message: 'Please sign in to access this resource',
                },
                401
            );
        }

        // Attach user info to context for use in controllers
        c.set('userId', session.user.id);
        c.set('user', session.user);
        c.set('session', session.session);

        await next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return c.json(
            {
                success: false,
                error: 'Unauthorized',
                message: 'Invalid or expired session',
            },
            401
        );
    }
}

/**
 * Optional auth middleware - doesn't require auth but attaches user if present
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
    try {
        let session: any = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        // Fallback for custom mobile session tokens
        if (!session) {
            const authHeader = c.req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const dbSession = await prisma.session.findFirst({
                    where: { token },
                    include: { user: true }
                });

                if (dbSession && dbSession.expiresAt > new Date()) {
                    const { user, ...sessionData } = dbSession;
                    session = {
                        session: sessionData,
                        user: user
                    };
                }
            }
        }

        if (session) {
            c.set('userId', session.user.id);
            c.set('user', session.user);
            c.set('session', session.session);
        }
    } catch (error) {
        // Silently continue without auth
    }

    await next();
}
