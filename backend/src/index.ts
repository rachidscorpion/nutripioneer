import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from '@/middleware/errorHandler';
import api from '@/routes';
import authRoutes from '@/routes/auth';
import menuRoutes from '@/routes/menu';
import checkoutRoutes from '@/routes/checkout';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://nutripioneer.com', 'https://www.nutripioneer.com', 'http://5.78.150.159', 'https://5.78.150.159'],
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

// Mount checkout routes before auth routes (so specific routes are matched first)
app.route('/api/auth', checkoutRoutes);
// Mount auth routes (not under /api for Better Auth compatibility)
app.route('/api/auth', authRoutes);

// Mount API routes
app.route('/api', api);

// Mount menu routes
app.route('/api/menu', menuRoutes);

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
