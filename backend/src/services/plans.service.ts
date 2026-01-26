import prisma from '@/db/client';
import type { CreatePlan, UpdatePlan } from '@/schemas';
import { ApiError } from '@/types';
import { recipesService } from '@/services/recipes.service';

export class PlansService {
    /**
     * Get plans for a user with optional date filtering
     */
    async getByUser(userId: string, options: { startDate?: Date; endDate?: Date } = {}) {
        const { startDate, endDate } = options;

        const where: Record<string, unknown> = { userId };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) (where.date as Record<string, unknown>).gte = startDate;
            if (endDate) (where.date as Record<string, unknown>).lte = endDate;
        }

        return prisma.plan.findMany({
            where,
            orderBy: { date: 'asc' },
            include: {
                breakfast: {
                    select: { id: true, name: true, image: true, calories: true, category: true },
                },
                lunch: {
                    select: { id: true, name: true, image: true, calories: true, category: true },
                },
                dinner: {
                    select: { id: true, name: true, image: true, calories: true, category: true },
                },
                restaurant: {
                    select: { id: true, chainName: true, itemName: true, notes: true },
                },
            },
        });
    }

    /**
     * Get plan by ID
     */
    async getById(id: string) {
        const plan = await prisma.plan.findUnique({
            where: { id },
            include: {
                breakfast: true,
                lunch: true,
                dinner: true,
                restaurant: true,
            },
        });

        if (!plan) {
            throw new ApiError(404, 'Plan not found');
        }

        return plan;
    }

    /**
     * Get plan for a specific user and date
     */
    async getByUserAndDate(userId: string, date: Date) {
        // Normalize date to start of day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        return prisma.plan.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: startOfDay,
                },
            },
            include: {
                breakfast: true,
                lunch: true,
                dinner: true,
                restaurant: true,
            },
        });
    }

    /**
     * Create a new plan
     */
    async create(data: CreatePlan) {
        // Normalize date to start of day
        const planDate = new Date(data.date);
        planDate.setHours(0, 0, 0, 0);

        // Check for existing plan on this date
        const existing = await prisma.plan.findUnique({
            where: {
                userId_date: {
                    userId: data.userId,
                    date: planDate,
                },
            },
        });

        if (existing) {
            throw new ApiError(400, 'Plan already exists for this date');
        }

        return prisma.plan.create({
            data: {
                ...data,
                date: planDate,
            },
            include: {
                breakfast: true,
                lunch: true,
                dinner: true,
            },
        });
    }

    /**
     * Update plan by ID
     */
    async update(id: string, data: UpdatePlan) {
        const existing = await prisma.plan.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'Plan not found');
        }

        return prisma.plan.update({
            where: { id },
            data,
            include: {
                breakfast: true,
                lunch: true,
                dinner: true,
                restaurant: true,
            },
        });
    }

    /**
     * Delete plan by ID
     */
    async delete(id: string) {
        const existing = await prisma.plan.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'Plan not found');
        }

        await prisma.plan.delete({
            where: { id },
        });

        return { deleted: true };
    }

    /**
     * Update meal status (breakfast/lunch/dinner)
     */
    async updateMealStatus(
        id: string,
        meal: 'breakfast' | 'lunch' | 'dinner',
        status: string
    ) {
        const statusField = `${meal}Status`;

        return prisma.plan.update({
            where: { id },
            data: {
                [statusField]: status,
            },
        });
    }

    /**
     * Mark plan as completed
     */
    async markCompleted(id: string) {
        return prisma.plan.update({
            where: { id },
            data: { isCompleted: true },
        });
    }


    /**
     * Generate a meal plan for a specific date
     */
    async generatePlan(userId: string, date: Date) {
        // Normalize date to start of day
        const planDate = new Date(date);
        planDate.setHours(0, 0, 0, 0);

        // Check if plan already exists
        const existing = await prisma.plan.findUnique({
            where: {
                userId_date: { userId, date: planDate },
            },
        });

        // 1. Get User Profile for personalization
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const getMeal = async (type: 'Breakfast' | 'Lunch' | 'Dinner') => {
            const useFatSecret = Math.random() > 0.5;
            let recipe = null;

            if (useFatSecret) {
                recipe = await recipesService.findOrCreateFromFatSecret(user, type);
                if (!recipe) {
                    recipe = await recipesService.findOrCreateFromEdamam(user, type);
                }
            } else {
                recipe = await recipesService.findOrCreateFromEdamam(user, type);
                if (!recipe) {
                    recipe = await recipesService.findOrCreateFromFatSecret(user, type);
                }
            }
            return recipe;
        };

        const breakfast = await getMeal('Breakfast');
        const lunch = await getMeal('Lunch');
        const dinner = await getMeal('Dinner');

        const planData = {
            breakfastId: breakfast?.id,
            lunchId: lunch?.id,
            dinnerId: dinner?.id,
        };

        return prisma.plan.upsert({
            where: {
                userId_date: { userId, date: planDate },
            },
            update: planData,
            create: {
                userId,
                date: planDate,
                ...planData
            },
            include: {
                breakfast: true,
                lunch: true,
                dinner: true,
                restaurant: true,
            },
        });
    }

    /**
     * Delete plan by user and date
     */
    async deleteByDate(userId: string, date: Date) {
        const planDate = new Date(date);
        planDate.setHours(0, 0, 0, 0);

        const existing = await prisma.plan.findUnique({
            where: {
                userId_date: { userId, date: planDate },
            },
        });

        if (!existing) {
            return { deleted: false };
        }

        await prisma.plan.delete({
            where: { id: existing.id },
        });

        return { deleted: true };
    }

    /**
     * Add external/restaurant meal to a plan
     */
    async addExternalMeal(userId: string, data: {
        planId?: string;
        date?: string;
        mealType?: 'breakfast' | 'lunch' | 'dinner';
        type?: 'breakfast' | 'lunch' | 'dinner';
        restaurantId?: string;
        name?: string;
        image?: string;
        instructions?: string;
        ingredients?: any;
        nutrition?: any;
        externalId?: string;
        source?: string;
    }) {
        let plan;
        if (data.planId) {
            plan = await prisma.plan.findUnique({ where: { id: data.planId } });
        } else if (data.date) {
            const planDate = new Date(data.date);
            planDate.setHours(0, 0, 0, 0);

            plan = await prisma.plan.findUnique({
                where: {
                    userId_date: { userId, date: planDate },
                },
            });

            if (!plan) {
                plan = await prisma.plan.create({
                    data: {
                        userId,
                        date: planDate,
                    },
                });
            }
        }

        if (!plan) {
            throw new ApiError(404, 'Plan not found');
        }

        const mealType = (data.mealType || data.type) as 'breakfast' | 'lunch' | 'dinner';
        if (!mealType) throw new ApiError(400, 'Meal type is required');

        // Case 1: External Food (USDA, OFF, FatSecret)
        if (data.externalId) {
            const existingRecipe = await prisma.recipe.findUnique({
                where: { externalId: String(data.externalId) },
            });

            let recipeId = existingRecipe?.id;

            if (!existingRecipe) {
                // Create new recipe
                const nutrient = (name: string) => Math.round(data.nutrition?.[name] || 0);

                let ingredients = data.ingredients;
                // Handle different ingredient formats
                if (typeof ingredients === 'string') {
                    // Check if it's already JSON stringified
                    if (ingredients.trim().startsWith('[') || ingredients.trim().startsWith('{')) {
                        try {
                            // It might be JSON array string
                            const parsed = JSON.parse(ingredients);
                            ingredients = Array.isArray(parsed) ? parsed : [parsed];
                        } catch {
                            // If parse fails, treat as simple string item
                            ingredients = [{ item: ingredients, measure: 'serving' }];
                        }
                    } else {
                        // Simple text description
                        ingredients = [{ item: ingredients, measure: 'serving' }];
                    }
                } else if (!Array.isArray(ingredients)) {
                    // If null or unknown object, empty array
                    ingredients = [];
                }

                const newRecipe = await prisma.recipe.create({
                    data: {
                        name: data.name || 'Unknown Food',
                        description: `Imported from ${data.source || 'External Source'}`,
                        instructions: data.instructions || '',
                        image: data.image || null,
                        category: mealType.charAt(0).toUpperCase() + mealType.slice(1), // Capitalize
                        prepTime: 0,
                        calories: nutrient('calories'),
                        protein: nutrient('protein'),
                        carbs: nutrient('carbs'),
                        fat: nutrient('fat'),
                        sodium: nutrient('sodium'),
                        sugar: nutrient('sugar'),
                        fiber: nutrient('fiber'),
                        tags: JSON.stringify([data.source || 'External']),
                        ingredients: JSON.stringify(ingredients),
                        externalId: String(data.externalId),
                        sourceAPI: data.source || 'External'
                    }
                });
                recipeId = newRecipe.id;
            }

            return prisma.plan.update({
                where: { id: plan.id },
                data: {
                    [`${mealType}Id`]: recipeId,
                    [`${mealType}Status`]: 'SWAPPED',
                },
                include: {
                    breakfast: true,
                    lunch: true,
                    dinner: true,
                    restaurant: true,
                },
            });
        }

        // Case 2: Restaurant Meal (Legacy/Existing)
        if (data.restaurantId) {
            return prisma.plan.update({
                where: { id: plan.id },
                data: {
                    restaurantId: data.restaurantId,
                    [`${mealType}Status`]: 'SWAPPED',
                },
                include: {
                    breakfast: true,
                    lunch: true,
                    dinner: true,
                    restaurant: true,
                },
            });
        }

        return plan;
    }

    /**
     * Swap a meal for another recipe
     */
    async swapMeal(planId: string, mealType: 'breakfast' | 'lunch' | 'dinner') {
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
            include: {
                breakfast: true,
                lunch: true,
                dinner: true
            }
        });

        if (!plan) {
            throw new ApiError(404, 'Plan not found');
        }

        // 1. Get User Profile for personalization
        const user = await prisma.user.findUnique({
            where: { id: plan.userId },
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Capitalize for Edamam (Breakfast/Lunch/Dinner)
        const edamamType = (mealType.charAt(0).toUpperCase() + mealType.slice(1)) as 'Breakfast' | 'Lunch' | 'Dinner';

        // Get current recipe external ID to exclude
        let excludeExternalId: string | undefined;
        // @ts-ignore
        const currentRecipe = plan[mealType];
        if (currentRecipe) {
            excludeExternalId = currentRecipe.externalId || undefined;
        }

        // Randomly choose source
        let newRecipe = null;
        if (Math.random() > 0.5) {
            newRecipe = await recipesService.findOrCreateFromEdamam(user, edamamType, excludeExternalId);
            if (!newRecipe) newRecipe = await recipesService.findOrCreateFromFatSecret(user, edamamType, excludeExternalId);
        } else {
            newRecipe = await recipesService.findOrCreateFromFatSecret(user, edamamType, excludeExternalId);
            if (!newRecipe) newRecipe = await recipesService.findOrCreateFromEdamam(user, edamamType, excludeExternalId);
        }

        if (!newRecipe) {
            throw new ApiError(500, 'Could not find a replacement meal');
        }

        return prisma.plan.update({
            where: { id: planId },
            data: {
                [`${mealType}Id`]: newRecipe.id,
                [`${mealType}Status`]: 'SWAPPED',
            },
            include: {
                breakfast: true,
                lunch: true,
                dinner: true,
            },
        });
    }
    /**
     * Remove a meal from the plan
     */
    async removeMeal(planId: string, mealType: 'breakfast' | 'lunch' | 'dinner') {
        const plan = await prisma.plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            throw new ApiError(404, 'Plan not found');
        }

        return prisma.plan.update({
            where: { id: planId },
            data: {
                [`${mealType}Id`]: null,
                [`${mealType}Status`]: 'SKIPPED', // Or remain PENDING? "SKIPPED" implies user removed it purposely.
            },
            include: {
                breakfast: true,
                lunch: true,
                dinner: true
            }
        });
    }
}

export const plansService = new PlansService();

