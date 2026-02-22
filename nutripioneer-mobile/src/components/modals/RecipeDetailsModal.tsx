import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api-client';

interface RecipeDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    recipe: any;
    nutritionLimits?: any;
}

const { width, height } = Dimensions.get('window');

export default function RecipeDetailsModal({ visible, onClose, recipe, nutritionLimits }: RecipeDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'instructions' | 'ingredients' | 'health'>('instructions');
    const [isAdding, setIsAdding] = useState(false);
    const [scrapedInstructions, setScrapedInstructions] = useState<string[] | null>(null);
    const [loadingInstructions, setLoadingInstructions] = useState(false);
    const [imgSrc, setImgSrc] = useState(recipe?.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80');

    useEffect(() => {
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

            if (targetUrl && !scrapedInstructions) {
                setLoadingInstructions(true);
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
                } catch (e) {
                    console.error("Failed to fetch instructions", e);
                } finally {
                    setLoadingInstructions(false);
                }
            }
        };

        fetchInstructions();
        setImgSrc(recipe.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80');
        setActiveTab('instructions');
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
                alert('Added ingredients to grocery list');
            }
        } catch (e) {
            console.error(e);
            alert('Error adding ingredients');
        } finally {
            setIsAdding(false);
        }
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
                                <Text style={[styles.tabText, activeTab === 'health' && styles.tabTextActive]}>Health Status</Text>
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
                                ) : (
                                    <>
                                        {instructionsSteps.length > 0 ? (
                                            instructionsSteps.map((step, idx) => (
                                                <View key={idx} style={styles.instructionStep}>
                                                    <View style={styles.stepNumberContainer}>
                                                        <Text style={styles.stepNumber}>{idx + 1}</Text>
                                                    </View>
                                                    <Text style={styles.stepText}>{step}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.emptyContentText}>No detailed instructions found.</Text>
                                        )}

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
                            <View style={styles.tabContent}>
                                {nutritionLimits?.reasoning && (
                                    <View style={styles.reasoningBox}>
                                        <Text style={styles.reasoningTitle}>Why this meal?</Text>
                                        <Text style={styles.reasoningText}>{nutritionLimits.reasoning}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.btnSecondary} onPress={handleAddIngredients} disabled={isAdding}>
                            {isAdding ? <ActivityIndicator size="small" color="#13ec5b" /> : <Ionicons name="cart" size={18} color="#13ec5b" />}
                            <Text style={styles.btnSecondaryText}>{isAdding ? "Adding..." : "Add to Groceries"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnPrimary} onPress={onClose}>
                            <Text style={styles.btnPrimaryText}>Done Cooking</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
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
        backgroundColor: 'rgba(0,0,0,0.5)', // Fallback if gradient not used
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
        backgroundColor: 'rgba(5b, 130, 246, 0.1)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(5b, 130, 246, 0.2)',
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
    footer: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#1a1a1c',
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
        gap: 12,
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#13ec5b',
        borderRadius: 16,
        paddingVertical: 14,
    },
    btnPrimaryText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
