'use server';

import { searchPhotos } from '@/lib/unsplash';

export async function getRandomFoodImage() {
    try {
        const photos = await searchPhotos('food', 10);
        if (photos.length > 0) {
            return photos[Math.floor(Math.random() * photos.length)].url;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch image from Unsplash:', error);
        return null;
    }
}
