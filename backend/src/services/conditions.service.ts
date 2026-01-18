import prisma from '@/db/client';
import type { CreateCondition } from '@/schemas';
import { ApiError } from '@/types';

export class ConditionsService {
    /**
     * Get all conditions with basic info
     */
    async getAll() {
        return prisma.condition.findMany({
            orderBy: { label: 'asc' },
            select: {
                id: true,
                slug: true,
                label: true,
                description: true,
                icon: true,
                color: true,
            },
        });
    }

    /**
     * Get condition by ID with all related data
     */
    async getById(id: string) {
        const condition = await prisma.condition.findUnique({
            where: { id },
            include: {
                nutrientLimits: true,
                ingredientExclusions: true,
            },
        });

        if (!condition) {
            throw new ApiError(404, 'Condition not found');
        }

        return {
            ...condition,
            nutritionalFocus: condition.nutritionalFocus
                ? JSON.parse(condition.nutritionalFocus)
                : null,
            allowedIngredients: condition.allowedIngredients
                ? JSON.parse(condition.allowedIngredients)
                : [],
            excludedIngredients: condition.excludedIngredients
                ? JSON.parse(condition.excludedIngredients)
                : [],
        };
    }

    /**
     * Get condition by slug
     */
    async getBySlug(slug: string) {
        const condition = await prisma.condition.findUnique({
            where: { slug },
            include: {
                nutrientLimits: true,
                ingredientExclusions: true,
            },
        });

        if (!condition) {
            throw new ApiError(404, 'Condition not found');
        }

        return {
            ...condition,
            nutritionalFocus: condition.nutritionalFocus
                ? JSON.parse(condition.nutritionalFocus)
                : null,
            allowedIngredients: condition.allowedIngredients
                ? JSON.parse(condition.allowedIngredients)
                : [],
            excludedIngredients: condition.excludedIngredients
                ? JSON.parse(condition.excludedIngredients)
                : [],
        };
    }

    /**
     * Create a new condition
     */
    async create(data: CreateCondition) {
        const existing = await prisma.condition.findUnique({
            where: { slug: data.slug },
        });

        if (existing) {
            throw new ApiError(400, 'Condition with this slug already exists');
        }

        return prisma.condition.create({
            data,
        });
    }

    /**
     * Get nutrient limits for a condition
     */
    async getNutrientLimits(conditionId: string) {
        return prisma.nutrientLimit.findMany({
            where: { conditionId },
            orderBy: { nutrient: 'asc' },
        });
    }

    /**
     * Get ingredient exclusions for a condition
     */
    async getExclusions(conditionId: string) {
        return prisma.ingredientExclusion.findMany({
            where: { conditionId },
            orderBy: { severity: 'asc' },
        });
    }

    /**
     * Get aggregated restrictions for multiple conditions
     * Used for users with multiple health conditions
     */
    async getAggregatedRestrictions(conditionIds: string[]) {
        const [limits, exclusions] = await Promise.all([
            prisma.nutrientLimit.findMany({
                where: { conditionId: { in: conditionIds } },
                include: { condition: { select: { slug: true, label: true } } },
            }),
            prisma.ingredientExclusion.findMany({
                where: { conditionId: { in: conditionIds } },
                include: { condition: { select: { slug: true, label: true } } },
            }),
        ]);

        // Group by nutrient/additive for easy lookup
        const nutrientMap = new Map<string, typeof limits>();
        for (const limit of limits) {
            const existing = nutrientMap.get(limit.nutrient) ?? [];
            existing.push(limit);
            nutrientMap.set(limit.nutrient, existing);
        }

        const exclusionMap = new Map<string, typeof exclusions>();
        for (const ex of exclusions) {
            const existing = exclusionMap.get(ex.additiveCategory) ?? [];
            existing.push(ex);
            exclusionMap.set(ex.additiveCategory, existing);
        }

        return {
            nutrientLimits: Object.fromEntries(nutrientMap),
            ingredientExclusions: Object.fromEntries(exclusionMap),
        };
    }
}

export const conditionsService = new ConditionsService();
