import prisma from '@/db/client';
import type { CreateMetric } from '@/schemas';
import { ApiError } from '@/types';

export class MetricsService {
    /**
     * Get metrics for a user with optional filtering
     */
    async getByUser(
        userId: string,
        options: {
            type?: string;
            startDate?: Date;
            endDate?: Date;
            limit?: number;
        } = {}
    ) {
        const { type, startDate, endDate, limit = 100 } = options;

        const where: Record<string, unknown> = { userId };

        if (type) {
            where.type = type;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
            if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
        }

        return prisma.metricLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get metric by ID
     */
    async getById(id: string) {
        const metric = await prisma.metricLog.findUnique({
            where: { id },
        });

        if (!metric) {
            throw new ApiError(404, 'Metric not found');
        }

        return metric;
    }

    /**
     * Create a new metric log
     */
    async create(data: CreateMetric) {
        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        return prisma.metricLog.create({
            data,
        });
    }

    /**
     * Delete metric by ID
     */
    async delete(id: string) {
        const existing = await prisma.metricLog.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'Metric not found');
        }

        await prisma.metricLog.delete({
            where: { id },
        });

        return { deleted: true };
    }

    /**
     * Get latest metric of each type for a user
     */
    async getLatestByUser(userId: string) {
        const types = ['GLUCOSE', 'BP', 'WEIGHT', 'WATER'];

        const results = await Promise.all(
            types.map(type =>
                prisma.metricLog.findFirst({
                    where: { userId, type },
                    orderBy: { createdAt: 'desc' },
                })
            )
        );

        return {
            glucose: results[0] || null,
            bloodPressure: results[1] || null,
            weight: results[2] || null,
            water: results[3] || null,
        };
    }

    /**
     * Get aggregate stats for a user's metrics
     */
    async getStats(userId: string, type: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const metrics = await prisma.metricLog.findMany({
            where: {
                userId,
                type,
                createdAt: { gte: startDate },
            },
            orderBy: { createdAt: 'asc' },
        });

        if (metrics.length === 0) {
            return null;
        }

        const values = metrics.map(m => m.value1).filter((v): v is number => v !== null);

        if (values.length === 0) {
            return null;
        }

        return {
            count: metrics.length,
            latest: metrics[metrics.length - 1],
            oldest: metrics[0],
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            trend: metrics.map(m => ({
                date: m.createdAt,
                value: m.value1,
                tag: m.tag,
            })),
        };
    }
}

export const metricsService = new MetricsService();
