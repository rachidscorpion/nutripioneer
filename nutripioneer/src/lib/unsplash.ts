import { createApi } from 'unsplash-js';

// Server-side only
const unsplash = createApi({
    accessKey: process.env.UNSPLASH_ACCESS_KEY!,
});

export const searchPhotos = async (query: string, perPage: number = 10) => {
    try {
        const result = await unsplash.search.getPhotos({
            query,
            perPage,
            orientation: 'landscape',
        });

        if (result.errors) {
            console.error('Unsplash API search errors:', result.errors);
            return [];
        }

        return result.response.results.map((photo) => ({
            id: photo.id,
            url: photo.urls.regular,
            thumbnail: photo.urls.small,
            alt: photo.alt_description || 'Unsplash image',
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
        }));
    } catch (error) {
        console.error('Error fetching photos from Unsplash:', error);
        return [];
    }
};

export default unsplash;
