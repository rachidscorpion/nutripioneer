import type { Context } from 'hono';
import { conditionsService } from '@/services/conditions.service';
import { createConditionSchema } from '@/schemas';
import { icdService } from '@/integrations/icd/icd.service';
import { generateConditionProfile } from '@/integrations/openai/openai.service';
import { prisma } from '@/db/client';

export class ConditionsController {
    async getAll(c: Context) {
        const conditions = await conditionsService.getAll();

        return c.json({
            success: true,
            data: conditions,
        });
    }

    async getById(c: Context) {
        const id = c.req.param('id');
        const condition = await conditionsService.getById(id);

        return c.json({
            success: true,
            data: condition,
        });
    }

    async getBySlug(c: Context) {
        const slug = c.req.param('slug');
        const condition = await conditionsService.getBySlug(slug);

        return c.json({
            success: true,
            data: condition,
        });
    }

    async create(c: Context) {
        const body = await c.req.json();
        const data = createConditionSchema.parse(body);

        const condition = await conditionsService.create(data);

        return c.json({
            success: true,
            data: condition,
        }, 201);
    }

    async getNutrientLimits(c: Context) {
        const id = c.req.param('id');
        const limits = await conditionsService.getNutrientLimits(id);

        return c.json({
            success: true,
            data: limits,
        });
    }

    async getExclusions(c: Context) {
        const id = c.req.param('id');
        const exclusions = await conditionsService.getExclusions(id);

        return c.json({
            success: true,
            data: exclusions,
        });
    }

    async getAggregatedRestrictions(c: Context) {
        const body = await c.req.json();
        const { conditionIds } = body;

        if (!Array.isArray(conditionIds)) {
            return c.json({
                success: false,
                error: 'conditionIds must be an array',
            }, 400);
        }

        const restrictions = await conditionsService.getAggregatedRestrictions(conditionIds);

        return c.json({
            success: true,
            data: restrictions,
        });
    }

    async searchICDConditions(c: Context) {
        const query = c.req.query('q');

        if (!query || query.trim().length === 0) {
            return c.json({
                success: false,
                error: 'Query parameter "q" is required',
            }, 400);
        }

        const results = await icdService.searchConditions(query);

        // If ICD API is unavailable, return empty results with a warning
        if (results.length === 0) {
            return c.json({
                success: true,
                data: [],
                warning: 'ICD-11 database search is currently unavailable. You can still add conditions manually.',
            });
        }

        return c.json({
            success: true,
            data: results,
        });
    }

    async onboardCondition(c: Context) {
        try {
            const body = await c.req.json();
            const { icdCode, title, uri, description } = body;

            // Allow icdCode to be optional (use URI as fallback unique identifier if needed, though we use icdCode for uniqueness usually)
            // Ideally we should use URI for uniqueness.
            // But let's just relax the check.
            if (!title || !uri) {
                console.error('[Conditions] Missing fields:', { title, uri });
                return c.json({
                    success: false,
                    error: 'Missing required fields: title, uri',
                }, 400);
            }

            // Use title as description if missing
            const finalDescription = description || title;

            let existingCondition = null;
            // Treat empty string code as NULL to allow multiple conditions without codes (assuming Prisma handles null uniqueness correctly)
            const safeIcdCode = icdCode && icdCode.trim().length > 0 ? icdCode : null;

            if (safeIcdCode) {
                existingCondition = await prisma.condition.findUnique({
                    where: { icdCode: safeIcdCode },
                });
            } else {
                // Try finding by slug if no code
                const slugCandidate = title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');

                existingCondition = await prisma.condition.findUnique({
                    where: { slug: slugCandidate },
                });
            }

            if (existingCondition) {
                return c.json({
                    success: true,
                    data: {
                        id: existingCondition.id,
                        message: 'Condition already exists',
                        isNew: false,
                    },
                });
            }

            const profile = await generateConditionProfile(title, finalDescription);

            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            const condition = await prisma.$transaction(async (tx) => {
                const newCondition = await tx.condition.create({
                    data: {
                        slug,
                        label: profile.label,
                        description: profile.description,
                        icon: profile.icon,
                        color: profile.color,
                        icdCode: safeIcdCode,
                        icdUri: uri,
                        nutritionalFocus: profile.nutritionalFocus ? JSON.stringify(profile.nutritionalFocus) : null,
                    },
                });

                if (profile.nutrientLimits && profile.nutrientLimits.length > 0) {
                    await tx.nutrientLimit.createMany({
                        data: profile.nutrientLimits.map((limit) => ({
                            conditionId: newCondition.id,
                            nutrient: limit.nutrient,
                            limitType: limit.limitType,
                            limitValue: limit.limitValue,
                            unit: limit.unit,
                            notes: limit.notes,
                        })),
                    });
                }

                if (profile.ingredientExclusions && profile.ingredientExclusions.length > 0) {
                    await tx.ingredientExclusion.createMany({
                        data: profile.ingredientExclusions.map((exclusion) => ({
                            conditionId: newCondition.id,
                            additiveCategory: exclusion.additiveCategory,
                            ingredientRegex: exclusion.ingredientRegex,
                            riskCategory: exclusion.riskCategory,
                            severity: exclusion.severity,
                        })),
                    });
                }

                return newCondition;
            });

            return c.json({
                success: true,
                data: {
                    id: condition.id,
                    message: 'Condition onboarded successfully',
                    isNew: true,
                },
            }, 201);
        } catch (error) {
            console.error('[Conditions] Onboarding failed:', error);
            return c.json({
                success: false,
                error: 'Failed to onboard condition',
                message: error instanceof Error ? error.message : 'Unknown error',
            }, 500);
        }
    }
}

export const conditionsController = new ConditionsController();
