'use client';
import { api } from '@/lib/api-client';
import { RefreshCw, ChefHat, CheckSquare, ShoppingBag, Trash2, PlusCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import styles from '@/styles/Timeline.module.css';
import RecipeDetailsModal from '@/components/modals/RecipeDetailsModal';
import { useRouter } from 'next/navigation';

interface MealCardProps {
    meal: any;
    type: 'breakfast' | 'lunch' | 'dinner';
    planId: string;
    userId: string;
    status?: string;
    nutritionLimits?: any;
}

export default function MealCard({ meal, type, planId, userId, status = 'PENDING', nutritionLimits }: MealCardProps) {
    const router = useRouter(); // Initialize router
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isCompleted = status === 'COMPLETED';

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = isCompleted ? 'PENDING' : 'COMPLETED';
        // Optimistic UI update could go here, but for now we rely on server revalidation
        try {
            await api.plans.updateStatus(planId, type, newStatus);
            toast.success(isCompleted ? 'Marked as pending' : 'Meal logged! Nice work.');
            router.refresh();
        } catch (e) {
            toast.error('Failed to update status');
        }
    };


    const handleDelete = async () => {
        if (!confirm('Are you sure you want to remove this meal?')) return;
        setIsLoading(true);
        try {
            await api.plans.removeMeal(planId, type);
            toast.success('Meal removed');
            router.refresh();
        } catch (e) {
            toast.error('Failed to remove meal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        setIsLoading(true);
        try {
            // Using swap to generate a new random meal for this slot
            await api.meals.swap(planId, type);
            toast.success('Meal added');
            router.refresh();
        } catch (e) {
            toast.error('Failed to add meal');
        } finally {
            setIsLoading(false);
        }
    };

    if (!meal) {
        return (
            <div className={`${styles.glassPanel} ${styles.emptyPanel}`}>
                <div className={styles.cardTime}>{type}</div>
                <div className={styles.emptyContent}>
                    <p>No meal assigned</p>
                    <button
                        onClick={handleAdd}
                        disabled={isLoading}
                        className={styles.btnAdd}
                    >
                        <PlusCircle size={18} />
                        Add Meal
                    </button>
                </div>
            </div>
        );
    }

    const tags = JSON.parse(meal.tags) as string[];
    // Logic to show "Why this works" badges
    const isDiabeticSafe = tags.includes('Low-GI') || tags.includes('Low-Carb');
    const isHeartSafe = tags.includes('DASH') || tags.includes('Low-Sodium');

    const handleSwap = async () => {
        setIsLoading(true);
        try {
            await api.meals.swap(planId, type);
            toast.success('Meal swapped!');
            router.refresh();
        } catch (e) {
            toast.error('Failed to swap meal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToGrocery = async () => {
        try {
            let ingredients = [];
            try {
                ingredients = JSON.parse(meal.ingredients);
            } catch (e) {
                console.error("Failed to parse ingredients", e);
                toast.error("No ingredients found");
                return;
            }

            if (ingredients.length > 0) {
                const res = await api.grocery.addIngredients(ingredients);
                // Assume API returns count or success
                toast.success(`Items added to grocery list`);
                router.push('/grocery'); // Navigate to grocery list
            } else {
                toast.info("No ingredients to add");
            }
        } catch (e) {
            toast.error("Failed to add ingredients");
        }
    };

    return (
        <div className={styles.glassPanel}>

            {/* Time Label */}
            <div className={styles.cardTime}>
                {type}
            </div>

            {meal.image && (
                <img src={meal.image} alt={meal.name} className={styles.cardImage} />
            )}

            <div className={styles.cardContent}>
                <h3>
                    {meal.name}
                </h3>
                <p className={styles.mealDescription}>{meal.description}</p>

                <div className={styles.tags}>
                    <span className={styles.calBadge}>
                        {meal.calories} kcal
                    </span>
                    {meal.prepTime > 0 && (
                        <span className={styles.calBadge} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {meal.prepTime > 999 ? meal.prepTime / 60 : meal.prepTime} min
                        </span>
                    )}
                    <span className={styles.calBadge}>
                        {meal.protein}g Protein
                    </span>
                    {isDiabeticSafe && (
                        <span className={styles.badgeGreen}>
                            Glucose Friendly
                        </span>
                    )}
                    {isHeartSafe && (
                        <span className={styles.badgeGreen}>
                            Heart Healthy
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.cardActions}>
                {/* Primary Action: View Recipe */}
                <button
                    className={styles.btnPrimary}
                    onClick={() => setIsModalOpen(true)}
                >
                    <ChefHat size={16} />
                    {isCompleted ? 'View Recipe' : 'Cook'}
                </button>

                {/* Secondary Action: Complete */}
                <button
                    className={`${styles.btnGhost} ${isCompleted ? styles.completedBtn : ''}`}
                    onClick={handleToggle}
                    title="Toggle complete"
                >
                    <CheckSquare size={18} className={isCompleted ? styles.completedIcon : ""} />
                </button>

                {/* Swap Logic */}
                <button
                    className={styles.btnGhost}
                    onClick={handleSwap}
                    disabled={isLoading || isCompleted}
                    title="Swap for different meal"
                >
                    <RefreshCw size={16} className={isLoading ? styles.spin : ""} />
                </button>

                {/* Delete Logic */}
                <button
                    className={styles.btnGhost}
                    onClick={handleDelete}
                    disabled={isLoading}
                    title="Remove meal"
                >
                    <Trash2 size={16} />
                </button>

                {/* Add to Grocery List */}
                <button
                    className={styles.btnGhost}
                    onClick={handleAddToGrocery}
                    title="Add ingredients to grocery list"
                >
                    <ShoppingBag size={18} />
                </button>
            </div>

            <RecipeDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                recipe={meal}
                userId={userId}
                nutritionLimits={nutritionLimits}
            />
        </div>
    );
}
