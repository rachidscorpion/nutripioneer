import type { Context } from 'hono';
import { metricsService } from '@/services/metrics.service';
import { createMetricSchema } from '@/schemas';
import { z } from 'zod';

// Schema for session-based metric creation (without userId in body)
const sessionMetricSchema = z.object({
    type: z.enum(['GLUCOSE', 'BP', 'WEIGHT', 'WATER']),
    value1: z.number().int().optional(),
    value2: z.number().int().optional(),
    tag: z.string().optional(),
});

export class MetricsController {
    async getByUser(c: Context) {
        const userId = c.req.param('userId');
        const query = c.req.query();

        const options: {
            type?: string;
            startDate?: Date;
            endDate?: Date;
            limit?: number;
        } = {};

        if (query.type) options.type = query.type;
        if (query.startDate) options.startDate = new Date(query.startDate);
        if (query.endDate) options.endDate = new Date(query.endDate);
        if (query.limit) options.limit = parseInt(query.limit, 10);

        const metrics = await metricsService.getByUser(userId, options);

        return c.json({
            success: true,
            data: metrics,
        });
    }

    async getById(c: Context) {
        const id = c.req.param('id');
        const metric = await metricsService.getById(id);

        return c.json({
            success: true,
            data: metric,
        });
    }

    async getLatest(c: Context) {
        const userId = c.req.param('userId');
        const latest = await metricsService.getLatestByUser(userId);

        return c.json({
            success: true,
            data: latest,
        });
    }

    async getStats(c: Context) {
        const userId = c.req.param('userId');
        const type = c.req.param('type');
        const days = c.req.query('days');

        const stats = await metricsService.getStats(
            userId,
            type,
            days ? parseInt(days, 10) : 30
        );

        return c.json({
            success: true,
            data: stats,
        });
    }

    async create(c: Context) {
        const body = await c.req.json();
        const data = createMetricSchema.parse(body);

        const metric = await metricsService.create(data);

        return c.json({
            success: true,
            data: metric,
        }, 201);
    }

    async delete(c: Context) {
        const id = c.req.param('id');
        await metricsService.delete(id);

        return c.json({
            success: true,
            message: 'Metric deleted successfully',
        });
    }

    // ============================================
    // Session-based endpoints
    // ============================================

    /**
     * POST /metrics - Log a metric (userId from session)
     */
    async log(c: Context) {
        const userId = c.get('userId');
        const body = await c.req.json();
        const data = sessionMetricSchema.parse(body);

        const metric = await metricsService.create({
            userId,
            ...data,
        });

        return c.json({
            success: true,
            data: metric,
        }, 201);
    }

    /**
     * GET /metrics - Get metrics history (userId from session)
     */
    async history(c: Context) {
        const userId = c.get('userId');
        const query = c.req.query();

        const options: {
            type?: string;
            startDate?: Date;
            endDate?: Date;
            limit?: number;
        } = {};

        if (query.type) options.type = query.type;
        if (query.startDate) options.startDate = new Date(query.startDate);
        if (query.endDate) options.endDate = new Date(query.endDate);
        if (query.limit) options.limit = parseInt(query.limit, 10);

        const metrics = await metricsService.getByUser(userId, options);

        return c.json({
            success: true,
            data: metrics,
        });
    }
}

export const metricsController = new MetricsController();

