import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { api } from '../../lib/api-client';
import SourceCitationBanner from '../ui/SourceCitationBanner';
import NPModal from './NPModal';
import { useTheme } from '../../context/ThemeContext';

interface RecipeDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    recipe: any;
    nutritionLimits?: any;
    planId?: string;
    mealType?: 'breakfast' | 'lunch' | 'dinner';
    onUpdate?: () => void;
}

const { width, height } = Dimensions.get('window');

export default function RecipeDetailsModal({ visible, onClose, recipe, nutritionLimits, planId, mealType, onUpdate }: RecipeDetailsModalProps) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'instructions' | 'ingredients' | 'health'>('instructions');
    const [isAdding, setIsAdding] = useState(false);
    const [scrapedInstructions, setScrapedInstructions] = useState<string[] | null>(null);
    const [loadingInstructions, setLoadingInstructions] = useState(false);
    const [instructionsError, setInstructionsError] = useState<string | null>(null);
    const [webviewUrl, setWebviewUrl] = useState<string | null>(null);
    const [webviewError, setWebviewError] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);
    const [imgSrc, setImgSrc] = useState(recipe?.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80');
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const prevRecipeIdRef = useRef<string | null>(null);
    const fetchGuardRef = useRef<string | null>(null);

    useEffect(() => {
        const currentRecipeId = recipe?.id;
        // Reset instruction-related state when recipe changes (even if modal is closed)
        if (currentRecipeId !== prevRecipeIdRef.current) {
            // Recipe changed, reset all instruction and UI state
            setScrapedInstructions(null);
            setInstructionsError(null);
            setLoadingInstructions(false);
            setWebviewUrl(null);
            setWebviewError(false);
            setActiveTab('instructions');
            setImgSrc(recipe?.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80');
            setIsSaved(false);
            setIsSaving(false);
            setIsAnalyzing(false);
            setAnalysisResult(null);
            setShowAnalysisModal(false);
            fetchGuardRef.current = null;
            prevRecipeIdRef.current = currentRecipeId;
        }

        if (!visible || !recipe) return;

        const fetchInstructions = async () => {
            let targetUrl = recipe.url;

            const isUrl = (str: string) => {
                if (!str) return false;
                try {
                    new URL(str);
                    return true;
                } catch {
                    return false;
                }
            };

            if (!targetUrl && recipe.instructions && isUrl(recipe.instructions)) {
                targetUrl = recipe.instructions;
            }

            // Only fetch if we haven't already fetched for this recipe
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

        const checkSavedStatus = async () => {
            if (!recipe.id) return;
            try {
                const res = await api.savedRecipes.check(recipe.id);
                setIsSaved(res.data?.data?.saved || false);
            } catch {
                setIsSaved(false);
            }
        };

        fetchInstructions();
        checkSavedStatus();
        setWebviewError(false);
    }, [visible, recipe]);

    if (!recipe) return null;

    let tags: string[] = [];
    try {
        tags = typeof recipe.tags === 'string' ? JSON.parse(recipe.tags) : recipe.tags || [];
    } catch (e) { }

    let ingredients: { item: string, measure: string }[] = [];
    try {
        ingredients = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients || [];
    } catch (e) { }

    const formatInstructions = (text: string) => {
        if (!text) return [];
        let cleanText = text.replace(/Step\s+\d+[:.]?/gi, '');
        const rawLines = cleanText.split(/\r?\n/);
        const steps: string[] = [];
        rawLines.forEach(line => {
            let trimmed = line.trim();
            if (!trimmed) return;
            trimmed = trimmed.replace(/^\d+[\)\.]\s*/, '');
            if (!trimmed) return;
            if (/^\d+$/.test(trimmed)) return;
            steps.push(trimmed);
        });
        if (steps.length <= 1 && text.length > 200) {
            return text.split('. ').filter(s => s.trim().length > 10).map(s => s.trim() + '.');
        }
        return steps;
    };

    const instructionsSteps = scrapedInstructions && scrapedInstructions.length > 0
        ? scrapedInstructions
        : formatInstructions(recipe.instructions);

    const handleAddIngredients = async () => {
        setIsAdding(true);
        try {
            let ingredientsPayload: string[] = [];
            if (recipe.uri) {
                try {
                    const response = await api.grocery.generateShoppingList([
                        { item: recipe.uri, quantity: 1 }
                    ]);

                    if (response.data?.success && response.data?.data?.entries) {
                        ingredientsPayload = response.data.data.entries.map((entry: any) => {
                            const q = entry.quantities?.[0];
                            if (q) {
                                const weight = Math.round(q.weight);
                                return `${entry.food} (${weight}${q.measure || 'g'})`;
                            }
                            return entry.food;
                        });
                    }
                } catch (err) {
                    console.error("Failed smart list", err);
                }
            }

            if (ingredientsPayload.length === 0 && ingredients.length > 0) {
                ingredientsPayload = ingredients.map(i => `${i.item} (${i.measure})`);
            }

            if (ingredientsPayload.length > 0) {
                await api.grocery.addIngredients(ingredientsPayload);
                Alert.alert('Success', 'Added ingredients to grocery list');
            } else {
                Alert.alert('Info', 'No ingredients found to add');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Error adding ingredients');
        } finally {
            setIsAdding(false);
        }
    };

    const handleSwapMeal = async () => {
        if (!planId || !mealType) return;
        setIsSwapping(true);
        try {
            await api.meals.swap(planId, mealType);
            onUpdate?.();
            onClose();
        } catch (e) {
            Alert.alert('Error', 'Failed to swap meal');
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
            } else {
                await api.savedRecipes.save(recipe.id);
            }
        } catch (e: any) {
            setIsSaved(wasSaved);
            if (e?.response?.status === 400) {
                setIsSaved(true);
            } else {
                Alert.alert('Error', wasSaved ? 'Failed to unsave recipe' : 'Failed to save recipe');
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
                Alert.alert('Error', 'Failed to analyze meal');
            }
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to analyze meal. Try again later.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderAnalysisContent = () => {
        if (!analysisResult) return null;

        const statusColor = analysisResult.status === 'SAFE' ? '#10b981' : analysisResult.status === 'CAUTION' ? '#f59e0b' : '#ef4444';
        const statusIcon = analysisResult.status === 'SAFE' ? 'shield-checkmark' : analysisResult.status === 'CAUTION' ? 'alert-triangle' : 'close-circle';

        return (
            <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.background, borderRadius: 14, padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: statusColor + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                        <Ionicons name={statusIcon} size={18} color={statusColor} />
                        <Text style={{ fontWeight: '700', color: statusColor, fontSize: 14 }}>{analysisResult.status}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text }}>{analysisResult.overallScore}</Text>
                        <Text style={{ fontSize: 14, color: theme.textMuted }}>/100</Text>
                    </View>
                </View>

                <Text style={{ fontSize: 14, lineHeight: 21, color: theme.textMuted }}>{analysisResult.reasoning}</Text>

                {analysisResult.nutritionalAnalysis && analysisResult.nutritionalAnalysis.length > 0 && (
                    <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nutritional Breakdown</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {analysisResult.nutritionalAnalysis.map((n: any, i: number) => {
                                const nColor = n.status === 'SAFE' ? '#10b981' : n.status === 'CAUTION' ? '#f59e0b' : '#ef4444';
                                return (
                                    <View key={i} style={{ flex: 1, minWidth: '45%', backgroundColor: theme.background, borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: nColor }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>{n.nutrient}</Text>
                                            <Text style={{ fontSize: 9, fontWeight: '700', color: nColor, textTransform: 'uppercase' }}>{n.status}</Text>
                                        </View>
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{n.value} {n.unit}</Text>
                                        <Text style={{ fontSize: 11, color: theme.textMuted }}>Limit: {n.limit}</Text>
                                        {n.note ? <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 3, lineHeight: 15 }}>{n.note}</Text> : null}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {analysisResult.ingredientConcerns && analysisResult.ingredientConcerns.length > 0 && (
                    <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ingredient Concerns</Text>
                        <View style={{ gap: 6 }}>
                            {analysisResult.ingredientConcerns.map((c: any, i: number) => {
                                const riskColor = c.risk === 'HIGH' ? '#ef4444' : c.risk === 'MEDIUM' ? '#f59e0b' : '#3b82f6';
                                return (
                                    <View key={i} style={{ backgroundColor: theme.background, borderRadius: 10, padding: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <Text style={{ fontSize: 9, fontWeight: '700', color: riskColor, textTransform: 'uppercase', backgroundColor: riskColor + '15', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>{c.risk}</Text>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{c.ingredient}</Text>
                                        </View>
                                        <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 16 }}>{c.reason}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {analysisResult.modifications && analysisResult.modifications.length > 0 && (
                    <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Suggested Modifications</Text>
                        <View style={{ gap: 6 }}>
                            {analysisResult.modifications.map((m: any, i: number) => (
                                <View key={i} style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#8b5cf6' }}>{m.action}</Text>
                                    <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 16, marginTop: 2 }}>{m.reason}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {analysisResult.summary && (
                    <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.06)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                        <Text style={{ fontSize: 13, lineHeight: 20, color: theme.textMuted }}>{analysisResult.summary}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>

                    {/* Header Image */}
                    <View style={styles.headerImageContainer}>
                        <Image
                            source={{ uri: imgSrc }}
                            style={styles.headerImage}
                            onError={() => setImgSrc('https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80')}
                        />
                        <View style={styles.headerOverlay}>
                            <Text style={styles.recipeName}>{recipe.name}</Text>
                            <View style={styles.tagsContainer}>
                                {tags.slice(0, 3).map((tag, i) => (
                                    <View key={i} style={styles.tagBadge}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="flame" size={20} color="#ef4444" style={styles.statIcon} />
                            <View>
                                <Text style={styles.statLabel}>ENERGY</Text>
                                <Text style={styles.statValue}>{recipe.calories} <Text style={styles.statUnit}>kcal</Text></Text>
                            </View>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="restaurant" size={20} color="#f59e0b" style={styles.statIcon} />
                            <View>
                                <Text style={styles.statLabel}>PROTEIN</Text>
                                <Text style={styles.statValue}>{recipe.protein}g</Text>
                            </View>
                        </View>
                        {recipe.prepTime > 0 && (
                            <View style={styles.statItem}>
                                <Ionicons name="time" size={20} color="#3b82f6" style={styles.statIcon} />
                                <View>
                                    <Text style={styles.statLabel}>TIME</Text>
                                    <Text style={styles.statValue}>
                                        {recipe.prepTime > 999 ? recipe.prepTime / 60 : recipe.prepTime} <Text style={styles.statUnit}>min</Text>
                                    </Text>
                                </View>
                            </View>
                        )}
                        {recipe.servingSize && (
                            <View style={styles.statItem}>
                                <Ionicons name="pie-chart" size={20} color="#10b981" style={styles.statIcon} />
                                <View>
                                    <Text style={styles.statLabel}>SERVING</Text>
                                    <Text style={styles.statValue}>
                                        {recipe.servingSize} <Text style={styles.statUnit}>{recipe.servingSizeUnit || 'g'}</Text>
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'instructions' && styles.tabBtnActive]}
                            onPress={() => setActiveTab('instructions')}
                        >
                            <Text style={[styles.tabText, activeTab === 'instructions' && styles.tabTextActive]}>Instructions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === 'ingredients' && styles.tabBtnActive]}
                            onPress={() => setActiveTab('ingredients')}
                        >
                            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>Ingredients</Text>
                        </TouchableOpacity>
                        {!!nutritionLimits && (
                            <TouchableOpacity
                                style={[styles.tabBtn, activeTab === 'health' && styles.tabBtnActive]}
                                onPress={() => setActiveTab('health')}
                            >
                                <Text style={[styles.tabText, activeTab === 'health' && styles.tabTextActive]}>Health Context</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Body */}
                    <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
                        {activeTab === 'instructions' ? (
                            <View style={styles.tabContent}>
                                {loadingInstructions ? (
                                    <View style={styles.loaderContainer}>
                                        <ActivityIndicator size="large" color="#13ec5b" />
                                        <Text style={styles.loaderText}>Fetching detailed instructions...</Text>
                                    </View>
                                ) : instructionsError ? (
                                    <View style={styles.errorBox}>
                                        <Ionicons name="alert-circle" size={32} color="#f59e0b" />
                                        <Text style={styles.errorTitle}>Instructions Unavailable</Text>
                                        <Text style={styles.errorText}>{instructionsError}</Text>
                                        {planId && mealType && (
                                            <TouchableOpacity
                                                style={styles.swapErrorBtn}
                                                onPress={handleSwapMeal}
                                                disabled={isSwapping}
                                            >
                                                {isSwapping ? (
                                                    <ActivityIndicator size="small" color="#000" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="refresh" size={16} color="#000" style={{ marginRight: 6 }} />
                                                        <Text style={styles.swapErrorBtnText}>Swap for a Different Recipe</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    <>
                                        {instructionsSteps.length > 0 ? (
                                            instructionsSteps.map((step, idx) => {
                                                const isStepUrl = typeof step === 'string' && step.startsWith('http');
                                                return (
                                                    <View key={idx} style={styles.instructionStep}>
                                                        {isStepUrl ? null : (
                                                            <View style={styles.stepNumberContainer}>
                                                                <Text style={styles.stepNumber}>{idx + 1}</Text>
                                                            </View>
                                                        )}
                                                        {isStepUrl ? (
                                                            null
                                                        ) : (
                                                            <Text style={styles.stepText}>{step}</Text>
                                                        )}
                                                    </View>
                                                );
                                            })
                                        ) : (
                                            <Text style={styles.emptyContentText}>No detailed instructions found.</Text>
                                        )}

                                        {(() => {
                                            const sourceUrl = recipe.url || (typeof recipe.instructions === 'string' && recipe.instructions.startsWith('http') ? recipe.instructions : null);
                                            return sourceUrl ? (
                                                <TouchableOpacity
                                                    onPress={() => { setWebviewError(false); setWebviewUrl(sourceUrl.replace(/^http:/, 'https:')); }}
                                                    style={styles.webviewPlaceholderBtn}
                                                >
                                                    <Ionicons name="link" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
                                                    <Text style={[styles.stepText, { color: '#3b82f6', textDecorationLine: 'underline', flex: 1 }]} numberOfLines={2}>
                                                        View Original Source
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : null;
                                        })()}

                                        <View style={styles.nutritionBoxContainer}>
                                            <Text style={styles.nutritionBoxTitle}>Nutrition Facts</Text>
                                            <View style={styles.nutritionGrid}>
                                                <View style={styles.nutritionBox}>
                                                    <Text style={styles.nutritionBoxLabel}>Carbs</Text>
                                                    <Text style={styles.nutritionBoxValue}>{recipe.carbs}g</Text>
                                                </View>
                                                <View style={styles.nutritionBox}>
                                                    <Text style={styles.nutritionBoxLabel}>Fat</Text>
                                                    <Text style={styles.nutritionBoxValue}>{recipe.fat}g</Text>
                                                </View>
                                                <View style={styles.nutritionBox}>
                                                    <Text style={styles.nutritionBoxLabel}>Fiber</Text>
                                                    <Text style={styles.nutritionBoxValue}>{recipe.fiber}g</Text>
                                                </View>
                                                <View style={styles.nutritionBox}>
                                                    <Text style={styles.nutritionBoxLabel}>Sodium</Text>
                                                    <Text style={styles.nutritionBoxValue}>{recipe.sodium}mg</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {recipe.sourceAPI && (
                                            <SourceCitationBanner
                                                compact
                                                text={`Recipe & nutrition data from ${recipe.sourceAPI === 'Edamam' ? 'Edamam Nutrition API' : recipe.sourceAPI === 'FatSecret' ? 'FatSecret Platform API' : recipe.sourceAPI || 'third-party database'}`}
                                            />
                                        )}
                                    </>
                                )}
                            </View>
                        ) : activeTab === 'ingredients' ? (
                            <View style={styles.tabContent}>
                                {ingredients.length > 0 ? (
                                    ingredients.map((ing, i) => (
                                        <View key={i} style={styles.ingredientRow}>
                                            <Text style={styles.ingredientItem}>{ing.item}</Text>
                                            <Text style={styles.ingredientMeasure}>{ing.measure}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyContentText}>No ingredients listed.</Text>
                                )}
                            </View>
                        ) : (
                            <View style={[styles.tabContent, { gap: 20 }]}>
                                {nutritionLimits?.reasoning && (
                                    <View style={styles.reasoningBox}>
                                        <Text style={styles.reasoningTitle}>Why this meal?</Text>
                                        <Text style={styles.reasoningText}>{nutritionLimits.reasoning}</Text>
                                    </View>
                                )}

                                <View>
                                    <Text style={styles.sectionTitleSmall}>Your Nutrition Profile Limits</Text>

                                    {nutritionLimits?.daily_calories && (
                                        <View style={styles.limitCardMain}>
                                            <Text style={styles.limitLabelSmall}>{nutritionLimits.daily_calories.label} Target</Text>
                                            <Text style={styles.limitValueLarge}>
                                                {nutritionLimits.daily_calories.min} - {nutritionLimits.daily_calories.max} kcal
                                            </Text>
                                        </View>
                                    )}

                                    {nutritionLimits?.nutrients && (
                                        <View style={styles.limitsGrid}>
                                            {Object.entries(nutritionLimits.nutrients).map(([key, data]: [string, any]) => (
                                                <View key={key} style={styles.limitCard}>
                                                    <Text style={styles.limitLabelSmall}>{data.label}</Text>
                                                    <Text style={styles.limitValue}>
                                                        {data.min && data.max
                                                            ? `${data.min} - ${data.max}${data.unit}`
                                                            : data.max
                                                                ? `< ${data.max}${data.unit}`
                                                                : data.min
                                                                    ? `> ${data.min}${data.unit}`
                                                                    : `${data.val}${data.unit}`}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {nutritionLimits?.avoid_ingredients && nutritionLimits.avoid_ingredients.length > 0 && (
                                    <View style={styles.avoidSection}>
                                        <Text style={styles.avoidTitle}>Avoid Ingredients per Logic:</Text>
                                        <View style={styles.avoidBadgesRow}>
                                            {nutritionLimits.avoid_ingredients.map((ing: string, i: number) => (
                                                <View key={i} style={styles.avoidBadge}>
                                                    <Text style={styles.avoidBadgeText}>{ing}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerRow}>
                            <TouchableOpacity style={styles.btnSecondary} onPress={handleAddIngredients} disabled={isAdding}>
                                {isAdding ? <ActivityIndicator size="small" color="#13ec5b" /> : <Ionicons name="cart" size={18} color="#13ec5b" />}
                                <Text style={styles.btnSecondaryText}>{isAdding ? "Adding..." : "Groceries"}</Text>
                            </TouchableOpacity>
                            {planId && mealType && (
                                <TouchableOpacity style={styles.btnSwap} onPress={handleSwapMeal} disabled={isSwapping}>
                                    {isSwapping ? <ActivityIndicator size="small" color="#9ca3af" /> : <Ionicons name="refresh" size={18} color="#9ca3af" />}
                                    <Text style={styles.btnSwapText}>{isSwapping ? "Swapping..." : "Swap"}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.btnSave, isSaved && styles.btnSaveActive]} onPress={handleToggleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <ActivityIndicator size="small" color={isSaved ? '#000' : '#f59e0b'} />
                                ) : (
                                    <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={isSaved ? '#000' : '#f59e0b'} />
                                )}
                                <Text style={[styles.btnSaveText, isSaved && styles.btnSaveTextActive]}>{isSaved ? "Saved" : "Save"}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.footerRow}>
                            <TouchableOpacity style={[styles.btnAnalyze, isAnalyzing && styles.btnAnalyzeDisabled]} onPress={handleAnalyzeMeal} disabled={isAnalyzing}>
                                {isAnalyzing ? <ActivityIndicator size="small" color="#8b5cf6" /> : <Ionicons name="sparkles" size={18} color="#8b5cf6" />}
                                <Text style={styles.btnAnalyzeText}>{isAnalyzing ? "Analyzing..." : "AI Analyze"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={onClose}>
                                <Text style={styles.btnPrimaryText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </View>

            <NPModal
                visible={showAnalysisModal}
                title="AI Meal Analysis"
                description={renderAnalysisContent()}
                onClose={() => setShowAnalysisModal(false)}
                actions={
                    <TouchableOpacity style={{ backgroundColor: '#8b5cf6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }} onPress={() => setShowAnalysisModal(false)}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Close</Text>
                    </TouchableOpacity>
                }
            />

            {/* WebView Full Screen Modal */}
            <Modal
                visible={!!webviewUrl}
                animationType="slide"
                onRequestClose={() => setWebviewUrl(null)}
            >
                <View style={styles.webviewHeader}>
                    <TouchableOpacity onPress={() => setWebviewUrl(null)} style={styles.webviewCloseBtn}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.webviewTitle} numberOfLines={1}>{recipe.name}</Text>
                    <TouchableOpacity onPress={() => { if (webviewUrl) Linking.openURL(webviewUrl); }} style={styles.webviewCloseBtn}>
                        <Ionicons name="open-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                {webviewUrl && !webviewError && (
                    <WebView
                        source={{ uri: webviewUrl }}
                        style={{ flex: 1 }}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c1e' }]}>
                                <ActivityIndicator size="large" color="#13ec5b" />
                            </View>
                        )}
                        onError={() => setWebviewError(true)}
                        onHttpError={() => setWebviewError(true)}
                    />
                )}
                {webviewUrl && webviewError && (
                    <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c1e', padding: 24 }]}>
                        <Ionicons name="globe-outline" size={48} color="#f59e0b" />
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>Unable to Load Page</Text>
                        <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>This website may be blocking access from your region or requires a secure connection.</Text>
                        <TouchableOpacity
                            style={{ backgroundColor: '#13ec5b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 24 }}
                            onPress={() => { if (webviewUrl) Linking.openURL(webviewUrl); }}
                        >
                            <Text style={{ color: '#000', fontWeight: 'bold' }}>Open in Browser</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ marginTop: 12 }}
                            onPress={() => { setWebviewError(false); setWebviewUrl(null); }}
                        >
                            <Text style={{ color: '#9ca3af' }}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1c1c1e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: height * 0.9,
        overflow: 'hidden',
    },
    headerImageContainer: {
        position: 'relative',
        height: 250,
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingTop: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    recipeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        gap: 16,
        marginTop: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statIcon: {
        marginRight: 8,
    },
    statLabel: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: 'bold',
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    statUnit: {
        fontSize: 10,
        fontWeight: 'normal',
        color: '#6b7280',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabBtnActive: {
        borderBottomColor: '#13ec5b',
    },
    tabText: {
        color: '#9ca3af',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#fff',
    },
    bodyScroll: {
        flex: 1,
    },
    tabContent: {
        padding: 20,
    },
    loaderContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loaderText: {
        color: '#9ca3af',
        marginTop: 12,
    },
    instructionStep: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    stepNumberContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepNumber: {
        color: '#13ec5b',
        fontWeight: 'bold',
    },
    stepText: {
        flex: 1,
        color: '#e5e7eb',
        fontSize: 16,
        lineHeight: 24,
    },
    emptyContentText: {
        color: '#9ca3af',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 20,
    },
    nutritionBoxContainer: {
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
    },
    nutritionBoxTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    nutritionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    nutritionBox: {
        alignItems: 'center',
        flex: 1,
    },
    nutritionBoxLabel: {
        color: '#9ca3af',
        fontSize: 12,
        marginBottom: 4,
    },
    nutritionBoxValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    ingredientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    ingredientItem: {
        color: '#fff',
        fontSize: 16,
        flex: 1,
    },
    ingredientMeasure: {
        color: '#9ca3af',
        fontSize: 16,
    },
    reasoningBox: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    reasoningTitle: {
        color: '#3b82f6',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    reasoningText: {
        color: '#e5e7eb',
        lineHeight: 22,
    },
    sectionTitleSmall: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    limitCardMain: {
        backgroundColor: '#2a2a2a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    limitLabelSmall: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    limitValueLarge: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    limitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    limitCard: {
        backgroundColor: '#2a2a2a',
        padding: 12,
        borderRadius: 10,
        flex: 1,
        minWidth: '45%',
    },
    limitValue: {
        color: '#13ec5b',
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 2,
    },
    avoidSection: {
        marginTop: 4,
    },
    avoidTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
        marginBottom: 10,
    },
    avoidBadgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    avoidBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    avoidBadgeText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#1a1a1c',
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
        gap: 10,
    },
    footerRow: {
        flexDirection: 'row',
        gap: 10,
    },
    btnSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.3)',
        paddingVertical: 14,
        gap: 8,
    },
    btnSecondaryText: {
        color: '#13ec5b',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnPrimary: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#13ec5b',
        borderRadius: 16,
        paddingVertical: 16,
    },
    btnPrimaryText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    btnSave: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        paddingVertical: 14,
        gap: 6,
    },
    btnSaveActive: {
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
    },
    btnSaveText: {
        color: '#f59e0b',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnSaveTextActive: {
        color: '#000',
    },
    webviewPlaceholderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    webviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#1c1c1e',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    webviewCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webviewTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    errorBox: {
        alignItems: 'center',
        padding: 32,
    },
    errorTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
    },
    errorText: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    swapErrorBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#13ec5b',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    swapErrorBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnSwap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        paddingVertical: 14,
        gap: 6,
    },
    btnSwapText: {
        color: '#9ca3af',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnAnalyze: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        paddingVertical: 14,
        gap: 6,
    },
    btnAnalyzeDisabled: {
        opacity: 0.6,
    },
    btnAnalyzeText: {
        color: '#8b5cf6',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
