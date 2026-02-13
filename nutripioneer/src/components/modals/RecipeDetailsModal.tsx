'use client';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Utensils, ShoppingBag, Loader2, ExternalLink, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
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
}

export default function RecipeDetailsModal({ isOpen, onClose, recipe, userId, nutritionLimits }: RecipeDetailsModalProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'instructions' | 'ingredients' | 'health'>('instructions');
    const [mounted, setMounted] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [scrapedInstructions, setScrapedInstructions] = useState<string[] | null>(null);
    const [loadingInstructions, setLoadingInstructions] = useState(false);
    const [imgSrc, setImgSrc] = useState(recipe.image || '/assets/np-placeholder.jpg');

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

            if (targetUrl && !scrapedInstructions) {
                setLoadingInstructions(true);
                try {
                    const res = await fetch(`/api/recipe?url=${encodeURIComponent(targetUrl)}`);
                    const data = await res.json();
                    if (data.instructions && Array.isArray(data.instructions) && data.instructions.length > 0) {
                        setScrapedInstructions(data.instructions);
                    } else if (data.directions && Array.isArray(data.directions) && data.directions.length > 0) {
                        setScrapedInstructions(data.directions);
                    } else {
                        setScrapedInstructions([]);
                    }
                } catch (e) {
                    console.error("Failed to fetch instructions", e);
                } finally {
                    setLoadingInstructions(false);
                }
            }
        };

        fetchInstructions();
    }, [isOpen, recipe.url, recipe.instructions]);

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
            const u = new URL(potentialUrl);
            sourceUrl = potentialUrl;
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
                                                            {(recipe.url || (recipe.instructions && recipe.instructions.startsWith('http'))) && (
                                                                <a href={recipe.url || recipe.instructions} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
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
                                <button
                                    onClick={handleAddIngredients}
                                    className={styles.btnSecondary}
                                    disabled={isAdding}
                                    style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <ShoppingBag size={18} />
                                    {isAdding ? 'Adding...' : 'Add Ingredients to grocery list'}
                                </button>
                                <button
                                    onClick={onClose}
                                    className={styles.btnPrimary}
                                >
                                    Done Cooking
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
