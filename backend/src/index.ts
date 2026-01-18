import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from '@/middleware/errorHandler';
import api from '@/routes';
import authRoutes from '@/routes/auth';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposeHeaders: ['Set-Cookie'],
}));
app.use('*', errorHandler);

// Health check endpoint
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Mount auth routes (not under /api for Better Auth compatibility)
app.route('/api/auth', authRoutes);

// Mount API routes
app.route('/api', api);

// 404 fallback
app.notFound((c) => {
    return c.json({
        success: false,
        error: 'Not Found',
        message: `Route ${c.req.method} ${c.req.path} not found`,
    }, 404);
});

// Export for the entry point
export default app;
