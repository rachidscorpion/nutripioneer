import { analyzeMeal, type MealAnalysisResult, type RecipeData } from '@/integrations/gemini/gemini.service';
import prisma from '@/db/client';

interface AnalyzeMealOptions {
    userId: string;
    recipeData: RecipeData;
}

export class MealAnalysisService {
    async analyze(options: AnalyzeMealOptions): Promise<MealAnalysisResult> {
        const { userId, recipeData } = options;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                conditions: true,
                onboardingData: true,
                nutritionLimits: true,
                age: true,
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const conditions: string[] = user.conditions ? JSON.parse(user.conditions) : [];
        let medications: any[] = [];
        let biometrics = { weight: 70, height: 170, age: user.age || 30, gender: 'Male' };

        if (user.onboardingData) {
            try {
                const onboarding = JSON.parse(user.onboardingData);
                if (onboarding.biometrics) {
                    biometrics = { ...biometrics, ...onboarding.biometrics };
                }
                if (onboarding.medical && onboarding.medical.medications) {
                    medications = onboarding.medical.medications;
                }
            } catch (e) {
                console.error('[MealAnalysisService] Failed to parse onboarding data', e);
            }
        }

        let nutritionLimits: Record<string, unknown> | null = null;
        if (user.nutritionLimits) {
            try {
                nutritionLimits = JSON.parse(user.nutritionLimits);
            } catch (e) {
                console.error('[MealAnalysisService] Failed to parse nutrition limits', e);
            }
        }

        let conditionProfiles: any[] = [];
        if (conditions.length > 0) {
            try {
                conditionProfiles = await prisma.condition.findMany({
                    where: { slug: { in: conditions } },
                    include: {
                        nutrientLimits: true,
                        ingredientExclusions: true,
                    }
                });
            } catch (e) {
                console.error('[MealAnalysisService] Failed to fetch condition profiles', e);
            }
        }

        const recentMetrics = await prisma.metricLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                type: true,
                value1: true,
                value2: true,
                tag: true,
                createdAt: true,
            }
        });

        const recentMetricsFormatted = recentMetrics.map(m => ({
            type: m.type,
            value1: m.value1 ?? undefined,
            value2: m.value2 ?? undefined,
            tag: m.tag ?? undefined,
            createdAt: m.createdAt.toISOString(),
        }));

        const healthProfile = {
            conditions,
            medications,
            biometrics,
            nutritionLimits: (nutritionLimits || undefined) as any,
            conditionProfiles,
            recentMetrics: recentMetricsFormatted.length > 0 ? recentMetricsFormatted : undefined,
        };

        return await analyzeMeal(recipeData, healthProfile);
    }
}

export const mealAnalysisService = new MealAnalysisService();
