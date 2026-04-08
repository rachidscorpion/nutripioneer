'use client';
import { useState } from 'react';
import { Bookmark, Flame, Utensils, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import RecipeDetailsModal from '@/components/modals/RecipeDetailsModal';
import styles from '@/styles/SavedMeals.module.css';

export default function SavedMealsClient({ initialRecipes }: { initialRecipes: any[] }) {
    const [recipes, setRecipes] = useState<any[]>(initialRecipes);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    const parseTags = (tagsStr?: string): string[] => {
        if (!tagsStr) return [];
        try {
            return typeof tagsStr === 'string' ? JSON.parse(tagsStr) : tagsStr;
        } catch {
            return [];
        }
    };

    const handleUnsave = async (recipe: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setRecipes(prev => prev.filter(r => r.id !== recipe.id));
        try {
            await api.savedRecipes.unsave(recipe.id);
            toast.success(`"${recipe.name}" removed from saved meals`);
        } catch {
            setRecipes(initialRecipes);
            toast.error('Failed to remove saved meal');
        }
    };

    const handleRecipeClick = (recipe: any) => {
        setSelectedRecipe(recipe);
        setShowModal(true);
    };

    if (recipes.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIconCircle}>
                    <Bookmark size={32} strokeWidth={1.5} />
                </div>
                <h3 className={styles.emptyTitle}>No saved meals yet</h3>
                <p className={styles.emptySubtext}>
                    Save meals from your daily plan to find them here later.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {recipes.map((recipe) => {
                const tags = parseTags(recipe.tags);
                return (
                    <div
                        key={recipe.id}
                        className={styles.recipeCard}
                        onClick={() => handleRecipeClick(recipe)}
                    >
                        <img
                            src={recipe.image || '/assets/np-placeholder.jpg'}
                            alt={recipe.name}
                            className={styles.recipeImage}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/np-placeholder.jpg'; }}
                        />
                        <div className={styles.recipeInfo}>
                            <h3 className={styles.recipeName}>{recipe.name}</h3>
                            <div className={styles.recipeMeta}>
                                {recipe.calories != null && (
                                    <div className={styles.metaItem}>
                                        <Flame size={14} color="#ef4444" />
                                        <span className={styles.metaText}>{recipe.calories} kcal</span>
                                    </div>
                                )}
                                {recipe.protein != null && (
                                    <div className={styles.metaItem}>
                                        <Utensils size={14} color="#f59e0b" />
                                        <span className={styles.metaText}>{recipe.protein}g protein</span>
                                    </div>
                                )}
                            </div>
                            {tags.length > 0 && (
                                <div className={styles.tagsRow}>
                                    {tags.slice(0, 2).map((tag: string, i: number) => (
                                        <span key={i} className={styles.tagBadge}>{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            className={styles.unsaveBtn}
                            onClick={(e) => handleUnsave(recipe, e)}
                            title="Remove from saved"
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })}

            {selectedRecipe && (
                <RecipeDetailsModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedRecipe(null);
                    }}
                    recipe={selectedRecipe}
                    userId=""
                />
            )}
        </div>
    );
}
