import type { Context, Next } from 'hono';
import { ZodError } from 'zod';
import { ApiError } from '@/types';

export async function errorHandler(c: Context, next: Next) {
    try {
        await next();
    } catch (error) {
        console.error('Error:', error);

        if (error instanceof ApiError) {
            return c.json(
                {
                    success: false,
                    error: error.message,
                    details: error.details,
                },
                error.statusCode as 400 | 404 | 500
            );
        }

        if (error instanceof ZodError) {
            return c.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: error.issues.map((e) => ({
                        path: String(e.path.join('.')),
                        message: e.message,
                    })),
                },
                400
            );
        }

        if (error instanceof Error) {
            return c.json(
                {
                    success: false,
                    error: error.message || 'Internal server error',
                },
                500
            );
        }

        return c.json(
            {
                success: false,
                error: 'An unexpected error occurred',
            },
            500
        );
    }
}
