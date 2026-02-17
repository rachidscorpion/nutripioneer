import type { Context } from 'hono';
import { usersService } from '@/services/users.service';
import { createUserSchema, updateUserSchema, paginationSchema } from '@/schemas';
import { calculateMedicalLimits, type HealthProfile } from '@/integrations/gemini/gemini.service';

export class UsersController {
    async getAll(c: Context) {
        const query = c.req.query();
        const { page, limit } = paginationSchema.parse(query);

        const result = await usersService.getAll(page, limit);

        return c.json({
            success: true,
            data: result.users,
            pagination: result.pagination,
        });
    }

    async getById(c: Context) {
        const id = c.req.param('id');
        const user = await usersService.getById(id);

        return c.json({
            success: true,
            data: user,
        });
    }

    async create(c: Context) {
        const body = await c.req.json();
        const data = createUserSchema.parse(body);

        const user = await usersService.create(data);

        return c.json({
            success: true,
            data: user,
        }, 201);
    }

    async update(c: Context) {
        const id = c.req.param('id');
        const body = await c.req.json();
        const data = updateUserSchema.parse(body);

        const user = await usersService.update(id, data);

        return c.json({
            success: true,
            data: user,
        });
    }

    async delete(c: Context) {
        const id = c.req.param('id');
        await usersService.delete(id);

        return c.json({
            success: true,
            message: 'User deleted successfully',
        });
    }

    async getSavedRecipes(c: Context) {
        const id = c.req.param('id');
        const recipes = await usersService.getSavedRecipes(id);

        return c.json({
            success: true,
            data: recipes,
        });
    }

    async saveRecipe(c: Context) {
        const userId = c.req.param('id');
        const { recipeId } = await c.req.json();

        const result = await usersService.saveRecipe(userId, recipeId);

        return c.json({
            success: true,
            data: result,
        });
    }

    async unsaveRecipe(c: Context) {
        const userId = c.req.param('id');
        const recipeId = c.req.param('recipeId');

        await usersService.unsaveRecipe(userId, recipeId);

        return c.json({
            success: true,
            message: 'Recipe removed from saved',
        });
    }

    // ============================================
    // Session-based profile endpoints
    // ============================================

    /**
     * Get current user's profile from session
     */
    async getProfile(c: Context) {
        const userId = c.get('userId');
        const user = await usersService.getById(userId);

        return c.json({
            success: true,
            data: user,
        });
    }

    /**
     * Update current user's profile
     */
    async updateProfile(c: Context) {
        const userId = c.get('userId');
        const body = await c.req.json();
        const data = updateUserSchema.parse(body);

        const user = await usersService.update(userId, data);
        if (user) {
            let onboardingData: any = {};
            try {
                if (user.onboardingData) {
                    onboardingData = JSON.parse(user.onboardingData as string);
                }
            } catch (e) {
                console.error('Failed to parse onboardingData', e);
            }

            let conditions: string[] = [];
            try {
                if (user.conditions) {
                    conditions = JSON.parse(user.conditions as string);
                }
            } catch (e) {
                // If it's just a regular string, wrap it
                if (typeof user.conditions === 'string') {
                    conditions = [user.conditions];
                }
            }

            const healthProfile: HealthProfile = {
                conditions: conditions,
                medications: onboardingData.medical || [],
                biometrics: {
                    weight: onboardingData.biometrics?.weight || 70,
                    height: onboardingData.biometrics?.height || 170,
                    age: user.age || onboardingData.biometrics?.age || 30,
                    gender: onboardingData.biometrics?.gender || 'unknown'
                },
            };

            // Only call if we have minimal data?
            if (healthProfile.biometrics.weight && healthProfile.biometrics.age) {
                try {
                    const limits = await calculateMedicalLimits(healthProfile);
                    // Save the generated limits
                    await usersService.update(userId, {
                        nutritionLimits: limits
                    });
                } catch (error) {
                    console.error("Failed to generate limits:", error);
                    // Don't fail the request, just log it
                }
            }
        }
        return c.json({
            success: true,
            data: user,
        });
    }

    /**
     * Update user's preferences only (without triggering limit regeneration)
     */
    async updatePreferences(c: Context) {
        const userId = c.get('userId');
        const body = await c.req.json();

        // Only update the preferences field, nothing else
        const user = await usersService.update(userId, {
            preferences: body.preferences
        });

        return c.json({
            success: true,
            data: user,
        });
    }

    /**
     * Get user's nutrition limits
     */
    async getNutritionLimits(c: Context) {
        const userId = c.get('userId');
        const user = await usersService.getById(userId);

        let limits = null;
        try {
            if ((user as any).nutritionLimits) {
                limits = JSON.parse((user as any).nutritionLimits as string);
            }
        } catch (e) {
            console.error('Failed to parse nutritionLimits', e);
        }

        return c.json({
            success: true,
            data: limits,
            // Also include raw conditions for frontend reference if needed, 
            // but keeping this payload clean for now
        });
    }

    /**
     * Update user's nutrition limits
     */
    async updateNutritionLimits(c: Context) {
        const userId = c.get('userId');
        const body = await c.req.json();

        // We handle this as a partial update to the user profile
        // but specifically targeting the nutritionLimits field
        const updateData: any = {
            nutritionLimits: body // Pass the raw object/JSON
        };

        const user = await usersService.update(userId, updateData);

        let limits = null;
        try {
            if ((user as any).nutritionLimits) {
                limits = JSON.parse((user as any).nutritionLimits as string);
            }
        } catch (e) {
            // ignore
        }

        return c.json({
            success: true,
            data: limits,
        });
    }

    /**
     * Generate nutrition limits using AI based on current profile
     */
    async generateNutritionLimits(c: Context) {
        const userId = c.get('userId');
        const user = await usersService.getById(userId);

        // Construct HealthProfile from user data
        let onboardingData: any = {};
        try {
            if (user.onboardingData) {
                onboardingData = JSON.parse(user.onboardingData as string);
            }
        } catch (e) {
            console.error('Failed to parse onboardingData', e);
        }

        let conditions: string[] = [];
        try {
            if (user.conditions) {
                conditions = JSON.parse(user.conditions as string);
            }
        } catch (e) {
            if (typeof user.conditions === 'string') {
                conditions = [user.conditions];
            }
        }

        const healthProfile: HealthProfile = {
            conditions: conditions,
            medications: onboardingData.medical || [],
            biometrics: {
                weight: onboardingData.biometrics?.weight || 70,
                height: onboardingData.biometrics?.height || 170,
                age: user.age || onboardingData.biometrics?.age || 30,
                gender: onboardingData.biometrics?.gender || 'unknown'
            },
        };

        let limits = null;
        // Verify we have enough data to generate
        if (healthProfile.biometrics.weight && healthProfile.biometrics.age) {
            try {
                limits = await calculateMedicalLimits(healthProfile);
            } catch (error) {
                console.error('OpenAI Generation Error:', error);
                return c.json({
                    success: false,
                    message: 'Failed to generate limits',
                }, 500);
            }
        } else {
            return c.json({
                success: false,
                message: 'Insufficient profile data for generation',
            }, 400);
        }

        return c.json({
            success: true,
            data: limits,
        });
    }

    /**
     * Sync subscription status manually with Polar
     */
    async syncSubscription(c: Context) {
        const userId = c.get('userId');
        const result = await usersService.syncSubscription(userId);

        return c.json({
            success: true,
            data: result,
        });
    }

    /**
     * Delete test account (for development/testing purposes)
     */
    async deleteTestAccount(c: Context) {
        const userId = c.get('userId');
        await usersService.delete(userId);

        return c.json({
            success: true,
            message: 'Test account deleted successfully',
        });
    }

    /**
     * Delete current user's account
     */
    async deleteAccount(c: Context) {
        const userId = c.get('userId');
        await usersService.delete(userId);

        return c.json({
            success: true,
            message: 'Account deleted successfully',
        });
    }
}

export const usersController = new UsersController();

