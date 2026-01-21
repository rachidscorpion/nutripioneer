'use server';

import { searchPhotos } from '@/lib/unsplash';

export async function getRandomFoodImage() {
    const healthyFoodNames = [
        'salad',
        'fruit',
        'vegetables',
        'lean meat',
        'whole grains',
        'nuts',
        'seeds',
        'legumes',
        'food',
        'healthy food',
        'diet',
        'nutrition',
        'wellness',
    ];
    const foodName = healthyFoodNames[Math.floor(Math.random() * healthyFoodNames.length)];
    try {
        const photos = await searchPhotos(foodName, 3);
        if (photos.length > 0) {
            return photos[Math.floor(Math.random() * photos.length)];
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch image from Unsplash:', error);
        return null;
    }
}
