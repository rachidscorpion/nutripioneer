'use client';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Utensils, ShoppingBag, Loader2, ExternalLink, Clock, RefreshCw, AlertCircle, Bookmark, Sparkles, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import styles from '@/styles/Timeline.module.css';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface RecipeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: any;
    userId: string;
    nutritionLimits?: any;
    planId?: string;
    mealType?: 'breakfast' | 'lunch' | 'dinner';
}

export default function RecipeDetailsModal({ isOpen, onClose, recipe, userId, nutritionLimits, planId, mealType }: RecipeDetailsModalProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'instructions' | 'ingredients' | 'health'>('instructions');
    const [mounted, setMounted] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [scrapedInstructions, setScrapedInstructions] = useState<string[] | null>(null);
    const [loadingInstructions, setLoadingInstructions] = useState(false);
    const [instructionsError, setInstructionsError] = useState<string | null>(null);
    const [isSwapping, setIsSwapping] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [imgSrc, setImgSrc] = useState(recipe.image || '/assets/np-placeholder.jpg');
    const prevRecipeIdRef = useRef<string | null>(null);
    const fetchGuardRef = useRef<string | null>(null);

    useEffect(() => {
        if (!recipe) return;
        const currentRecipeId = recipe.id;
        if (currentRecipeId !== prevRecipeIdRef.current) {
            setScrapedInstructions(null);
            setInstructionsError(null);
            setLoadingInstructions(false);
            setActiveTab('instructions');
            setImgSrc(recipe.image || '/assets/np-placeholder.jpg');
            setIsSaved(false);
            setIsSaving(false);
            setIsAnalyzing(false);
            setAnalysisResult(null);
            setShowAnalysisModal(false);
            fetchGuardRef.current = null;
            prevRecipeIdRef.current = currentRecipeId;
        }
    }, [recipe]);

    useEffect(() => {
        if (!isOpen || !recipe?.id) return;
        const checkSavedStatus = async () => {
            try {
                const res = await api.savedRecipes.check(recipe.id);
                setIsSaved(res.data?.data?.saved || false);
            } catch {
                setIsSaved(false);
            }
        };
        checkSavedStatus();
    }, [isOpen, recipe?.id]);

    useEffect(() => {
        const fetchInstructions = async () => {
            // Determine the URL. 
            // - recipe.url might exist
            // - recipe.instructions might be a URL (as per user input)
            let targetUrl = recipe.url;

            const isUrl = (str: string) => {
                if (!str) return false;
                try {
                    new URL(str);
                    return true;
                } catch {
                    return false; // Pattern check fallback if needed, but URL constructor is reliable
                }
            };

            if (!targetUrl && recipe.instructions && isUrl(recipe.instructions)) {
                targetUrl = recipe.instructions;
            }

            if (targetUrl && targetUrl.startsWith('http://')) {
                targetUrl = targetUrl.replace('http://', 'https://');
            }

            if (targetUrl && fetchGuardRef.current !== recipe.id) {
                setLoadingInstructions(true);
                setInstructionsError(null);
                try {
                    const res = await api.recipes.getInstructions(targetUrl);
                    const data = res.data;
                    if (data?.instructions && Array.isArray(data.instructions) && data.instructions.length > 0) {
                        setScrapedInstructions(data.instructions);
                    } else if (data?.directions && Array.isArray(data.directions) && data.directions.length > 0) {
                        setScrapedInstructions(data.directions);
                    } else {
                        setScrapedInstructions([]);
                    }
                    fetchGuardRef.current = recipe.id;
                } catch (e: any) {
                    const status = e?.response?.status;
                    if (status === 500) {
                        setInstructionsError('This recipe source is currently unavailable. The site may be blocking access from your region.');
                    } else {
                        setInstructionsError('Failed to load instructions. Please try again later.');
                    }
                } finally {
                    setLoadingInstructions(false);
                }
            }
        };

        fetchInstructions();
    }, [isOpen, recipe?.id, recipe?.url, recipe?.instructions]);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!mounted || !recipe) return null;

    let tags: string[] = [];
    try {
        tags = JSON.parse(recipe.tags);
    } catch (e) { tags = []; }

    let ingredients: { item: string, measure: string }[] = [];
    try {
        ingredients = JSON.parse(recipe.ingredients);
    } catch (e) { ingredients = []; }

    const handleAddIngredients = async () => {
        setIsAdding(true);
        try {
            let ingredientsPayload: string[] = [];

            // 1. Try to generate via Edamam API if we have a recipe URI (usually available in Edamam recipes)
            // If recipe.uri exists, we can use it.
            // If not, we might fall back to parsing ingredients
            if (recipe.uri) {
                try {

                    const response = await api.grocery.generateShoppingList([
                        { item: recipe.uri, quantity: 1 }
                    ]);

                    if (response.data?.success && response.data?.data) {
                        const list = response.data.data; // EdamamShoppingListResponse
                        // Format: entries -> food -> quantities
                        // We want to extract a nice string for the user's grocery list
                        // If the response structure matches EdamamShoppingListResponse interface from service
                        if (list.entries) {
                            ingredientsPayload = list.entries.map((entry: any) => {
                                // Prefer the 'food' name, maybe add quantity if we want
                                // Entry has quantities array.
                                const q = entry.quantities?.[0];
                                if (q) {
                                    // e.g. "Chicken Breast (500g)"
                                    // rounding weight
                                    const weight = Math.round(q.weight);
                                    return `${entry.food} (${weight}${q.measure || 'g'})`;
                                }
                                return entry.food;
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to generate smart list, falling back to simple list", err);
                }
            }

            // 2. Fallback if empty
            if (ingredientsPayload.length === 0) {
                if (ingredients.length > 0) {
                    ingredientsPayload = ingredients.map(i => `${i.item} (${i.measure})`);
                } else {
                    // Last resort: simple list from tags or title? No, just stop.
                    toast.error("No ingredients found to add");
                    setIsAdding(false);
                    return;
                }
            }

            // 3. Add to grocery
            await api.grocery.addIngredients(ingredientsPayload);

            router.push('/grocery');
            toast.success(`Added ingredients to grocery list`);
        } catch (e) {
            console.error(e);
            toast.error('Error adding ingredients');
        } finally {
            setIsAdding(false);
        }
    };

    const handleSwapMeal = async () => {
        if (!planId || !mealType) return;
        setIsSwapping(true);
        try {
            await api.meals.swap(planId, mealType);
            toast.success('Meal swapped!');
            router.refresh();
        } catch (e) {
            toast.error('Failed to swap meal');
        } finally {
            setIsSwapping(false);
        }
    };

    const handleToggleSave = async () => {
        if (!recipe.id) return;
        setIsSaving(true);
        const wasSaved = isSaved;
        setIsSaved(!wasSaved);
        try {
            if (wasSaved) {
                await api.savedRecipes.unsave(recipe.id);
                toast.success('Recipe unsaved');
            } else {
                await api.savedRecipes.save(recipe.id);
                toast.success('Recipe saved!');
            }
        } catch (e: any) {
            setIsSaved(wasSaved);
            if (e?.response?.status === 400) {
                setIsSaved(true);
            } else {
                toast.error(wasSaved ? 'Failed to unsave recipe' : 'Failed to save recipe');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleAnalyzeMeal = async () => {
        setIsAnalyzing(true);
        try {
            const res = await api.meals.analyzeMeal({
                name: recipe.name,
                calories: recipe.calories,
                protein: recipe.protein,
                carbs: recipe.carbs,
                fat: recipe.fat,
                sodium: recipe.sodium,
                sugar: recipe.sugar,
                fiber: recipe.fiber,
                servingSize: recipe.servingSize,
                servingSizeUnit: recipe.servingSizeUnit,
                ingredients: recipe.ingredients,
                prepTime: recipe.prepTime,
                tags: recipe.tags,
            });
            if (res.data?.success && res.data?.data) {
                setAnalysisResult(res.data.data);
                setShowAnalysisModal(true);
            } else {
                toast.error('Failed to analyze meal');
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to analyze meal. Try again later.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ... (existing helper functions unchanged if they were outside main flow, but formatInstructions is inside so we just continue)

    // Enhanced Instruction Parsing
    const formatInstructions = (text: string) => {
        if (!text) return [];
        let cleanText = text.replace(/Step\s+\d+[:.]?/gi, '');
        const rawLines = cleanText.split(/\r?\n/);
        const steps: string[] = [];
        rawLines.forEach(line => {
            let trimmed = line.trim();
            if (!trimmed) return;
            trimmed = trimmed.replace(/^\d+[\).]\s*/, '');
            if (!trimmed) return;
            if (/^\d+$/.test(trimmed)) return;
            steps.push(trimmed);
        });
        if (steps.length <= 1 && text.length > 200) {
            return text.split('. ').filter(s => s.trim().length > 10).map(s => s.trim() + '.');
        }
        return steps;
    };

    // Use scraped instructions if available, otherwise fallback to existing formatted ones
    const instructionsSteps = scrapedInstructions && scrapedInstructions.length > 0
        ? scrapedInstructions
        : formatInstructions(recipe.instructions);

    // Calculate source URL safely
    let sourceUrl: string | null = null;
    let sourceHostname: string | null = null;

    // Try recipe.url first, then check if instructions looks like a URL
    const potentialUrl = recipe.url || (typeof recipe.instructions === 'string' && recipe.instructions.startsWith('http') ? recipe.instructions : null);

    if (potentialUrl) {
        try {
            let httpsUrl = potentialUrl;
            if (httpsUrl.startsWith('http://')) {
                httpsUrl = httpsUrl.replace('http://', 'https://');
            }
            const u = new URL(httpsUrl);
            sourceUrl = httpsUrl;
            sourceHostname = u.hostname.replace('www.', '');
        } catch (e) {
            // Invalid URL, ignore
        }
    }

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Wrapper for Centering */}
                    <motion.div
                        className={styles.modalWrapper}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Modal Content */}
                        <motion.div
                            className={styles.modalContent}
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                        >
                            {/* Header Image */}
                            <div className={styles.modalHeaderImage}>
                                {imgSrc && (
                                    <Image
                                        loading='eager'
                                        src={imgSrc}
                                        alt={recipe.name}
                                        width={500}
                                        height={500}
                                        className={styles.cardImage}
                                        onError={() => setImgSrc('/assets/np-placeholder.jpg')}
                                    />
                                )}

                                <div className={styles.modalHeaderOverlay}>
                                    <div>
                                        <h2 className={styles.modalTitle}>{recipe.name}</h2>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                            {tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button onClick={onClose} className={styles.closeBtn}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Stats */}
                            <div className={styles.modalStats}>
                                <div className={styles.modalStatItem}>
                                    <div className={`${styles.modalStatIcon} ${styles.energy}`}>
                                        <Flame size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Energy</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{recipe.calories} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>kcal</span></div>
                                    </div>
                                </div>
                                <div className={styles.modalStatItem}>
                                    <div className={`${styles.modalStatIcon} ${styles.protein}`}>
                                        <Utensils size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Protein</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{recipe.protein}g</div>
                                    </div>
                                </div>
                                {recipe.prepTime > 0 && (
                                    <div className={styles.modalStatItem}>
                                        <div className={`${styles.modalStatIcon}`}>
                                            <Clock size={20} color="#3b82f6" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Time</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                                {recipe.prepTime > 999 ? recipe.prepTime / 60 : recipe.prepTime} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>min</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {recipe.servingSize && (
                                    <div className={styles.modalStatItem}>
                                        <div className={`${styles.modalStatIcon} ${styles.serving}`}>
                                            <Utensils size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Serving</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                                {recipe.servingSize} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>{recipe.servingSizeUnit || 'g'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tabs */}
                            <div className={styles.modalTabs}>
                                <button
                                    onClick={() => setActiveTab('instructions')}
                                    className={`${styles.tabBtn} ${activeTab === 'instructions' ? styles.active : ''}`}
                                >
                                    Instructions
                                </button>
                                <button
                                    onClick={() => setActiveTab('ingredients')}
                                    className={`${styles.tabBtn} ${activeTab === 'ingredients' ? styles.active : ''}`}
                                >
                                    Ingredients
                                </button>
                                {nutritionLimits && (
                                    <button
                                        onClick={() => setActiveTab('health')}
                                        className={`${styles.tabBtn} ${activeTab === 'health' ? styles.active : ''}`}
                                    >
                                        Health Context
                                    </button>
                                )}
                            </div>

                            {/* Body */}
                            <div className={styles.modalBody}>
                                <div className={styles.tabContent}>
                                    {activeTab === 'instructions' ? (
                                        <div >
                                            {loadingInstructions ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem', color: '#64748b' }}>
                                                    <Loader2 className="animate-spin" size={32} />
                                                    <span>Fetching detailed instructions...</span>
                                                </div>
                                            ) : instructionsError ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem', color: '#64748b', textAlign: 'center' }}>
                                                    <AlertCircle size={32} color="#f59e0b" />
                                                    <h3 style={{ margin: 0, color: '#0f172a' }}>Instructions Unavailable</h3>
                                                    <p>{instructionsError}</p>
                                                    {planId && mealType && (
                                                        <button
                                                            onClick={handleSwapMeal}
                                                            disabled={isSwapping}
                                                            className={styles.btnSecondary}
                                                            style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                        >
                                                            {isSwapping ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                                            Swap for a Different Recipe
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {instructionsSteps.length > 0 ? instructionsSteps.map((step, idx) => (
                                                        <div key={idx} className={styles.instructionStep}>
                                                            <div className={styles.stepNumber}>
                                                                {idx + 1}
                                                            </div>
                                                            <p className={styles.stepText}>{step}</p>
                                                        </div>
                                                    )) : (
                                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                                            <p>No detailed instructions found.</p>
                                                            {sourceUrl && (
                                                                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                                                                    View original recipe <ExternalLink size={14} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Source Link if we have instructions but still want to link out */}
                                                    {/* Source Link if we have instructions but still want to link out */}
                                                    {instructionsSteps.length > 0 && sourceUrl && (
                                                        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                                                            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                Source: {sourceHostname} <ExternalLink size={12} />
                                                            </a>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Nutrition Facts Small Section */}
                                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nutrition Facts</h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                                                    {[
                                                        { label: 'Carbs', val: recipe.carbs + 'g' },
                                                        { label: 'Fat', val: recipe.fat + 'g' },
                                                        { label: 'Fiber', val: recipe.fiber + 'g' },
                                                        { label: 'Sodium', val: recipe.sodium + 'mg' },
                                                    ].map((stat, i) => (
                                                        <div key={i} className={styles.nutritionBox}>
                                                            <div className={styles.nutritionBoxLabel}>{stat.label}</div>
                                                            <div className={styles.nutritionBoxValue}>{stat.val}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : activeTab === 'ingredients' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {ingredients.map((ing, i) => (
                                                <div key={i} className={styles.ingredientRow}>
                                                    <span className={styles.ingredientName}>{ing.item}</span>
                                                    <span className={styles.ingredientMeasure}>
                                                        {ing.measure}
                                                    </span>
                                                </div>
                                            ))}
                                            {ingredients.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                    No ingredients listed.
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            {nutritionLimits?.reasoning && (
                                                <div className={styles.reasoningBox}>
                                                    <h4>Why this meal?</h4>
                                                    <p>
                                                        {nutritionLimits.reasoning}
                                                    </p>
                                                </div>
                                            )}

                                            <div>
                                                <h4 className={styles.sectionTitleSmall}>Your Nutrition Profile limits</h4>

                                                {/* Daily Calories */}
                                                {nutritionLimits?.daily_calories && (
                                                    <div className={styles.limitCardMain}>
                                                        <div className={styles.limitLabelSmall}>{nutritionLimits.daily_calories.label} Target</div>
                                                        <div className={styles.limitValueLarge}>
                                                            {nutritionLimits.daily_calories.min} - {nutritionLimits.daily_calories.max} kcal
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Nutrients */}
                                                {nutritionLimits?.nutrients && (
                                                    <div className={styles.limitsGrid}>
                                                        {Object.entries(nutritionLimits.nutrients).map(([key, data]: [string, any]) => (
                                                            <div key={key} className={styles.limitCard}>
                                                                <div className={styles.limitLabelSmall}>{data.label}</div>
                                                                <div className={styles.limitValue}>
                                                                    {data.min && data.max ? (
                                                                        <>{data.min} - {data.max}{data.unit}</>
                                                                    ) : data.max ? (
                                                                        <>&lt; {data.max}{data.unit}</>
                                                                    ) : data.min ? (
                                                                        <>&gt; {data.min}{data.unit}</>
                                                                    ) : (
                                                                        <>{data.val}{data.unit}</>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Avoid Ingredients */}
                                                {nutritionLimits?.avoid_ingredients && nutritionLimits.avoid_ingredients.length > 0 && (
                                                    <div style={{ marginTop: '1rem' }}>
                                                        <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem' }}>Avoid Ingredients per Logic:</h5>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                            {nutritionLimits.avoid_ingredients.map((ing: string, i: number) => (
                                                                <span key={i} className={styles.avoidBadge}>
                                                                    {ing}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className={styles.modalFooter}>
                                <div className={styles.modalFooterRow}>
                                    <button
                                        onClick={handleAddIngredients}
                                        className={styles.btnSecondary}
                                        disabled={isAdding}
                                    >
                                        {isAdding ? <Loader2 size={18} className="spin" /> : <ShoppingBag size={18} />}
                                        {isAdding ? 'Adding...' : 'Groceries'}
                                    </button>
                                    {planId && mealType && (
                                        <button
                                            onClick={handleSwapMeal}
                                            className={styles.btnSwap}
                                            disabled={isSwapping}
                                        >
                                            {isSwapping ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
                                            {isSwapping ? 'Swapping...' : 'Swap'}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleToggleSave}
                                        className={`${styles.btnSave} ${isSaved ? styles.btnSaveActive : ''}`}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 size={18} className="spin" /> : <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />}
                                        {isSaved ? 'Saved' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleAnalyzeMeal}
                                        className={styles.btnAnalyze}
                                        disabled={isAnalyzing}
                                    >
                                        {isAnalyzing ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                                        {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
                                    </button>
                                </div>
                                <div className={styles.modalFooterRow}>
                                    <button
                                        onClick={onClose}
                                        className={styles.btnPrimary}
                                    >
                                        Done Cooking
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {showAnalysisModal && analysisResult && createPortal(
                        <AnimatePresence>
                            {showAnalysisModal && (
                                <>
                                    <motion.div
                                        className={styles.analysisBackdrop}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setShowAnalysisModal(false)}
                                    />
                                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10002 }}>
                                        <motion.div
                                            className={styles.analysisModalWrapper}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ type: "spring", duration: 0.5 }}
                                            style={{ pointerEvents: 'auto' }}
                                        >
                                            <div className={styles.analysisModalContent}>
                                                <div className={styles.analysisHeader}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <Sparkles size={20} className={styles.analysisSparkleIcon} />
                                                        <h3 className={styles.analysisTitle}>AI Meal Analysis</h3>
                                                    </div>
                                                    <button onClick={() => setShowAnalysisModal(false)} className={styles.analysisCloseBtn}>
                                                        <X size={20} />
                                                    </button>
                                                </div>

                                                <div className={styles.analysisBody}>
                                                    <div className={styles.analysisScoreRow}>
                                                        <div className={`${styles.analysisScoreBadge} ${analysisResult.status === 'SAFE' ? styles.scoreSafe : analysisResult.status === 'CAUTION' ? styles.scoreCaution : styles.scoreAvoid}`}>
                                                            {analysisResult.status === 'SAFE' ? <ShieldCheck size={20} /> : analysisResult.status === 'CAUTION' ? <ShieldAlert size={20} /> : <ShieldX size={20} />}
                                                            <span>{analysisResult.status}</span>
                                                        </div>
                                                        <div className={styles.analysisScoreValue}>
                                                            <div className={styles.analysisScoreNumber}>{analysisResult.overallScore}</div>
                                                            <div className={styles.analysisScoreLabel}>/100</div>
                                                        </div>
                                                    </div>

                                                    <p className={styles.analysisReasoning}>{analysisResult.reasoning}</p>

                                                    {analysisResult.nutritionalAnalysis && analysisResult.nutritionalAnalysis.length > 0 && (
                                                        <div className={styles.analysisSection}>
                                                            <h4 className={styles.analysisSectionTitle}>Nutritional Breakdown</h4>
                                                            <div className={styles.analysisNutrientGrid}>
                                                                {analysisResult.nutritionalAnalysis.map((n: any, i: number) => (
                                                                    <div key={i} className={`${styles.analysisNutrientCard} ${n.status === 'SAFE' ? styles.nutrientSafe : n.status === 'CAUTION' ? styles.nutrientCaution : n.status === 'AVOID' ? styles.nutrientAvoid : ''}`}>
                                                                        <div className={styles.nutrientCardHeader}>
                                                                            <span className={styles.nutrientCardName}>{n.nutrient}</span>
                                                                            <span className={`${styles.nutrientCardStatus} ${n.status === 'SAFE' ? styles.statusSafe : n.status === 'CAUTION' ? styles.statusCaution : styles.statusAvoid}`}>{n.status}</span>
                                                                        </div>
                                                                        <div className={styles.nutrientCardValue}>{n.value} {n.unit}</div>
                                                                        <div className={styles.nutrientCardLimit}>Limit: {n.limit}</div>
                                                                        {n.note && <div className={styles.nutrientCardNote}>{n.note}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {analysisResult.ingredientConcerns && analysisResult.ingredientConcerns.length > 0 && (
                                                        <div className={styles.analysisSection}>
                                                            <h4 className={styles.analysisSectionTitle}>Ingredient Concerns</h4>
                                                            <div className={styles.concernList}>
                                                                {analysisResult.ingredientConcerns.map((c: any, i: number) => (
                                                                    <div key={i} className={styles.concernItem}>
                                                                        <span className={`${styles.concernRisk} ${c.risk === 'HIGH' ? styles.riskHigh : c.risk === 'MEDIUM' ? styles.riskMedium : styles.riskLow}`}>{c.risk}</span>
                                                                        <span className={styles.concernName}>{c.ingredient}</span>
                                                                        <span className={styles.concernReason}>{c.reason}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {analysisResult.modifications && analysisResult.modifications.length > 0 && (
                                                        <div className={styles.analysisSection}>
                                                            <h4 className={styles.analysisSectionTitle}>Suggested Modifications</h4>
                                                            <div className={styles.modList}>
                                                                {analysisResult.modifications.map((m: any, i: number) => (
                                                                    <div key={i} className={styles.modItem}>
                                                                        <span className={styles.modAction}>{m.action}</span>
                                                                        <span className={styles.modReason}>{m.reason}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={styles.analysisSummaryBox}>
                                                        <p>{analysisResult.summary}</p>
                                                    </div>
                                                </div>

                                                <div className={styles.analysisFooter}>
                                                    <button className={styles.analysisCloseAction} onClick={() => setShowAnalysisModal(false)}>Close</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
