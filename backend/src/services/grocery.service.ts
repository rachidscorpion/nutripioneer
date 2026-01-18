import prisma from '@/db/client';
import type { CreateGroceryItem, UpdateGroceryItem } from '@/schemas';
import { ApiError } from '@/types';

export class GroceryService {
    /**
     * Get all grocery items for a user
     */
    async getByUser(userId: string) {
        return prisma.groceryItem.findMany({
            where: { userId },
            orderBy: [
                { isChecked: 'asc' },
                { category: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }

    /**
     * Get grocery items grouped by category
     */
    async getByUserGrouped(userId: string) {
        const items = await prisma.groceryItem.findMany({
            where: { userId },
            orderBy: [
                { isChecked: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        // Group by category
        const grouped: Record<string, typeof items> = {};
        for (const item of items) {
            const category = item.category || 'Uncategorized';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        }

        return grouped;
    }

    /**
     * Get grocery item by ID
     */
    async getById(id: string) {
        const item = await prisma.groceryItem.findUnique({
            where: { id },
        });

        if (!item) {
            throw new ApiError(404, 'Grocery item not found');
        }

        return item;
    }

    /**
     * Create a new grocery item
     */
    async create(data: CreateGroceryItem) {
        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        return prisma.groceryItem.create({
            data,
        });
    }

    /**
     * Create multiple grocery items at once
     */
    async createMany(userId: string, items: { name: string; category?: string }[]) {
        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const data = items.map(item => ({
            userId,
            name: item.name,
            category: item.category,
        }));

        await prisma.groceryItem.createMany({ data });

        return this.getByUser(userId);
    }

    /**
     * Update grocery item by ID
     */
    async update(id: string, data: UpdateGroceryItem) {
        const existing = await prisma.groceryItem.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'Grocery item not found');
        }

        return prisma.groceryItem.update({
            where: { id },
            data,
        });
    }

    /**
     * Toggle checked status
     */
    async toggleChecked(id: string) {
        const existing = await prisma.groceryItem.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'Grocery item not found');
        }

        return prisma.groceryItem.update({
            where: { id },
            data: { isChecked: !existing.isChecked },
        });
    }

    /**
     * Delete grocery item by ID
     */
    async delete(id: string) {
        const existing = await prisma.groceryItem.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ApiError(404, 'Grocery item not found');
        }

        await prisma.groceryItem.delete({
            where: { id },
        });

        return { deleted: true };
    }

    /**
     * Clear all checked items for a user
     */
    async clearChecked(userId: string) {
        await prisma.groceryItem.deleteMany({
            where: { userId, isChecked: true },
        });

        return this.getByUser(userId);
    }

    /**
     * Clear all items for a user
     */
    async clearAll(userId: string) {
        await prisma.groceryItem.deleteMany({
            where: { userId },
        });

        return { cleared: true };
    }

    /**
     * Seed default grocery items for a user
     */
    async seed(userId: string) {
        const defaultItems = [
            { name: 'Eggs', category: 'Dairy & Eggs' },
            { name: 'Milk', category: 'Dairy & Eggs' },
            { name: 'Bread', category: 'Bakery' },
            { name: 'Butter', category: 'Dairy & Eggs' },
            { name: 'Chicken Breast', category: 'Meat & Seafood' },
            { name: 'Rice', category: 'Grains & Pasta' },
            { name: 'Olive Oil', category: 'Oils & Condiments' },
            { name: 'Garlic', category: 'Produce' },
            { name: 'Onions', category: 'Produce' },
            { name: 'Tomatoes', category: 'Produce' },
            { name: 'Bananas', category: 'Produce' },
            { name: 'Apples', category: 'Produce' },
            { name: 'Spinach', category: 'Produce' },
            { name: 'Greek Yogurt', category: 'Dairy & Eggs' },
            { name: 'Oats', category: 'Grains & Pasta' },
        ];

        const data = defaultItems.map(item => ({
            userId,
            name: item.name,
            category: item.category,
        }));

        await prisma.groceryItem.createMany({ data });

        return this.getByUser(userId);
    }

    /**
     * Add multiple ingredients at once
     */
    async addIngredients(userId: string, ingredients: string[]) {
        const data = ingredients.map(name => ({
            userId,
            name,
            category: 'Recipe Ingredients',
        }));

        await prisma.groceryItem.createMany({ data });

        return this.getByUser(userId);
    }
}

export const groceryService = new GroceryService();

