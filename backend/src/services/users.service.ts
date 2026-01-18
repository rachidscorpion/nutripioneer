import prisma from '@/db/client';
import type { CreateUser, UpdateUser } from '@/schemas';
import { ApiError } from '@/types';

export class UsersService {
    /**
     * Get all users with pagination
     */
    async getAll(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    emailVerified: true,
                    image: true,
                    age: true,
                    conditions: true,
                    primaryAnchor: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.user.count(),
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get user by ID with related data
     */
    async getById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                metricLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                savedRecipes: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        category: true,
                    },
                },
                groceryItems: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        return user;
    }

    /**
     * Create a new user
     */
    async create(data: CreateUser) {
        // Check if email already exists
        const existing = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            throw new ApiError(400, 'Email already registered');
        }

        // Prepare create data
        const createData: any = { ...data };

        // Handle conditions serialization if it's an array
        if (data.conditions && Array.isArray(data.conditions)) {
            createData.conditions = JSON.stringify(data.conditions);
        }

        return prisma.user.create({
            data: {
                name: createData.name,
                email: createData.email,
                age: createData.age,
                conditions: createData.conditions,
                primaryAnchor: createData.primaryAnchor,
                onboardingData: createData.onboardingData,
            },
        });
    }

    /**
     * Update user by ID
     */
    async update(id: string, data: UpdateUser) {
        const existing = await prisma.user.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'User not found');
        }

        // Check email uniqueness if updating email
        if (data.email && data.email !== existing.email) {
            const emailTaken = await prisma.user.findUnique({
                where: { email: data.email },
            });
            if (emailTaken) {
                throw new ApiError(400, 'Email already in use');
            }
        }

        // Prepare update data for Prisma
        // We cast to any because we're going to transform fields that Prisma doesn't know about
        const updateData: any = { ...data };

        // 1. Handle Onboarding Data Serialization
        // If we receive structured data (biometrics, medical, dietary), we serialize it into onboardingData
        if (data.biometrics || data.medical || data.dietary || data.conditions) {
            let currentOnboardingData = {};
            if (existing.onboardingData) {
                try {
                    currentOnboardingData = JSON.parse(existing.onboardingData);
                } catch (e) {
                    // Safe to ignore if previous data wasn't JSON
                }
            }

            const newOnboardingData = {
                ...currentOnboardingData,
                ...(data.biometrics && { biometrics: data.biometrics }),
                ...(data.medical && { medical: data.medical }),
                ...(data.dietary && { dietary: data.dietary }),
                ...(data.conditions && { conditions: data.conditions }),
            };

            updateData.onboardingData = JSON.stringify(newOnboardingData);
        }

        // 2. Handle Top-Level Mappings
        // Map biometrics.age to user.age if not explicitly provided
        if (data.biometrics?.age && typeof data.age === 'undefined') {
            updateData.age = data.biometrics.age;
        }

        // 3. Handle Conditions (Array -> String serialization)
        // Prisma expects a String, but Zod confirms we might get string[]
        if (data.conditions) {
            if (Array.isArray(data.conditions)) {
                updateData.conditions = JSON.stringify(data.conditions);
            } else if (typeof data.conditions !== 'string') {
                // Fallback for unknown types
                updateData.conditions = JSON.stringify(data.conditions);
            }
        }

        // 5. Handle Nutrition Limits (Object -> String serialization)
        if (data.nutritionLimits) {
            if (typeof data.nutritionLimits !== 'string') {
                updateData.nutritionLimits = JSON.stringify(data.nutritionLimits);
            }
        }
        // 4. Cleanup: Remove fields that don't exist in Prisma User model
        delete updateData.biometrics;
        delete updateData.medical;
        delete updateData.dietary;

        return prisma.user.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * Delete user by ID
     */
    async delete(id: string) {
        const existing = await prisma.user.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'User not found');
        }

        await prisma.user.delete({
            where: { id },
        });

        return { deleted: true };
    }

    /**
     * Get user's saved recipes
     */
    async getSavedRecipes(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                savedRecipes: true,
            },
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        return user.savedRecipes;
    }

    /**
     * Add recipe to user's saved recipes
     */
    async saveRecipe(userId: string, recipeId: string) {
        const [user, recipe] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.recipe.findUnique({ where: { id: recipeId } }),
        ]);

        if (!user) throw new ApiError(404, 'User not found');
        if (!recipe) throw new ApiError(404, 'Recipe not found');

        return prisma.user.update({
            where: { id: userId },
            data: {
                savedRecipes: {
                    connect: { id: recipeId },
                },
            },
            include: {
                savedRecipes: {
                    select: { id: true, name: true },
                },
            },
        });
    }

    /**
     * Remove recipe from user's saved recipes
     */
    async unsaveRecipe(userId: string, recipeId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                savedRecipes: {
                    disconnect: { id: recipeId },
                },
            },
        });
    }
}

export const usersService = new UsersService();
