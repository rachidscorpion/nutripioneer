import prisma from '@/db/client';

function toNumber(val: unknown): number {
    if (typeof val === 'bigint') return Number(val);
    if (typeof val === 'number') return val;
    return 0;
}

export class AdminService {
    async getOverview() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            newSignups7d,
            newSignups30d,
            activeSubscriptions,
            totalPlans,
            totalRecipes,
            totalFeedback,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.user.count({ where: { subscriptionStatus: 'active' } }),
            prisma.plan.count(),
            prisma.recipe.count(),
            prisma.feedback.count(),
        ]);

        return {
            totalUsers,
            newSignups7d,
            newSignups30d,
            activeSubscriptions,
            totalPlans,
            totalRecipes,
            totalFeedback,
        };
    }

    async getSignups(days: number = 30) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const sinceISO = since.toISOString();

        const rows = await prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
            `SELECT DATE(createdAt) as date, COUNT(*) as count 
             FROM User 
             WHERE createdAt >= ? 
             GROUP BY DATE(createdAt) 
             ORDER BY date ASC`,
            sinceISO
        );

        return rows.map(r => ({ date: r.date, count: toNumber(r.count) }));
    }

    async getConditionDistribution() {
        const users = await prisma.user.findMany({
            where: { conditions: { not: null } },
            select: { conditions: true },
        });

        const counts: Record<string, number> = {};

        for (const user of users) {
            if (!user.conditions) continue;
            try {
                const parsed: string[] = JSON.parse(user.conditions);
                for (const condition of parsed) {
                    counts[condition] = (counts[condition] || 0) + 1;
                }
            } catch {
                // skip unparseable
            }
        }

        return Object.entries(counts)
            .map(([condition, count]) => ({ condition, count }))
            .sort((a, b) => b.count - a.count);
    }

    async getMealCompletionRates() {
        const breakfastRows = await prisma.$queryRawUnsafe<{ status: string; count: bigint }[]>(
            `SELECT breakfastStatus as status, COUNT(*) as count FROM Plan GROUP BY breakfastStatus`
        );
        const lunchRows = await prisma.$queryRawUnsafe<{ status: string; count: bigint }[]>(
            `SELECT lunchStatus as status, COUNT(*) as count FROM Plan GROUP BY lunchStatus`
        );
        const dinnerRows = await prisma.$queryRawUnsafe<{ status: string; count: bigint }[]>(
            `SELECT dinnerStatus as status, COUNT(*) as count FROM Plan GROUP BY dinnerStatus`
        );

        const toMap = (rows: { status: string; count: bigint }[]) => {
            const map: Record<string, number> = {};
            for (const r of rows) {
                map[r.status] = toNumber(r.count);
            }
            return map;
        };

        const totalPlans = await prisma.plan.count();

        return {
            breakfast: toMap(breakfastRows),
            lunch: toMap(lunchRows),
            dinner: toMap(dinnerRows),
            totalPlans,
        };
    }

    async getPopularRecipes(limit: number = 10) {
        const rows = await prisma.$queryRawUnsafe<{
            id: string;
            name: string;
            image: string | null;
            planCount: bigint;
        }[]>(
            `SELECT r.id, r.name, r.image,
                (SELECT COUNT(*) FROM Plan WHERE breakfastId = r.id) +
                (SELECT COUNT(*) FROM Plan WHERE lunchId = r.id) +
                (SELECT COUNT(*) FROM Plan WHERE dinnerId = r.id) as planCount
             FROM Recipe r
             ORDER BY planCount DESC
             LIMIT ?`,
            limit
        );

        const recipeIds = rows.map(r => r.id);
        const saveCounts = await prisma.userRecipe.groupBy({
            by: ['recipeId'],
            where: { recipeId: { in: recipeIds } },
            _count: { recipeId: true },
        });

        const saveMap: Record<string, number> = {};
        for (const s of saveCounts) {
            saveMap[s.recipeId] = s._count.recipeId;
        }

        return rows.map(r => ({
            id: r.id,
            name: r.name,
            image: r.image,
            planCount: toNumber(r.planCount),
            saveCount: saveMap[r.id] || 0,
        }));
    }

    async getSubscriptionStats() {
        const rows = await prisma.$queryRawUnsafe<{ status: string; count: bigint }[]>(
            `SELECT COALESCE(subscriptionStatus, 'inactive') as status, COUNT(*) as count 
             FROM User 
             GROUP BY COALESCE(subscriptionStatus, 'inactive')`
        );

        return rows.map(r => ({ status: r.status, count: toNumber(r.count) }));
    }

    async getOnboardingFunnel() {
        const [
            totalUsers,
            withConditions,
            withOnboardingData,
            withNutritionLimits,
            withPlan,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { conditions: { not: null } } }),
            prisma.user.count({ where: { onboardingData: { not: null } } }),
            prisma.user.count({ where: { nutritionLimits: { not: null } } }),
            prisma.$queryRawUnsafe<{ count: bigint }[]>(
                `SELECT COUNT(DISTINCT userId) as count FROM Plan`
            ),
        ]);

        return {
            totalUsers,
            withConditions,
            withOnboardingData,
            withNutritionLimits,
            withPlan: toNumber(withPlan[0]?.count),
        };
    }

    async getFeedbackOverview() {
        const [recent, typeRows] = await Promise.all([
            prisma.feedback.findMany({
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: { user: { select: { name: true, email: true, image: true } } },
            }),
            prisma.$queryRawUnsafe<{ type: string; count: bigint }[]>(
                `SELECT type, COUNT(*) as count FROM Feedback GROUP BY type`
            ),
        ]);

        const byType: Record<string, number> = {};
        for (const r of typeRows) {
            byType[r.type] = toNumber(r.count);
        }

        return { recent, byType };
    }

    async getMetricTrends(days: number = 30) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const sinceISO = since.toISOString();

        const rows = await prisma.$queryRawUnsafe<{ date: string; type: string; count: bigint }[]>(
            `SELECT DATE(createdAt) as date, type, COUNT(*) as count 
             FROM MetricLog 
             WHERE createdAt >= ? 
             GROUP BY DATE(createdAt), type 
             ORDER BY date ASC, type ASC`,
            sinceISO
        );

        return rows.map(r => ({
            date: r.date,
            type: r.type,
            count: toNumber(r.count),
        }));
    }
}

export const adminService = new AdminService();
