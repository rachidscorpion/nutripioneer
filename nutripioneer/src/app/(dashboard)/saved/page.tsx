import { requireAuth, fetchWithAuth } from '@/lib/server-auth';
import SavedMealsClient from './SavedMealsClient';

export default async function SavedMealsPage() {
    await requireAuth();

    let recipes: any[] = [];
    try {
        const res = await fetchWithAuth('/users/saved-recipes');
        recipes = (res && res.data) || [];
    } catch (e) {
        console.error("Failed to fetch saved recipes", e);
    }

    return (
        <main className="min-h-screen bg-white pb-20">
            <div className="pt-10 px-5">
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                    Saved Meals
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} saved
                </p>
            </div>
            <SavedMealsClient initialRecipes={recipes} />
        </main>
    );
}
