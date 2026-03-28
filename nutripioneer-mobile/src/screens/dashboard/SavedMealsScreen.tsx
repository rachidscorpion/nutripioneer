import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api-client';
import { useTheme } from '../../context/ThemeContext';
import RecipeDetailsModal from '../../components/modals/RecipeDetailsModal';

interface SavedRecipe {
    id: string;
    name: string;
    image?: string;
    category?: string;
    calories?: number;
    protein?: number;
    prepTime?: number;
    tags?: string;
    ingredients?: string;
    instructions?: string;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
    servingSize?: number;
    servingSizeUnit?: string;
    sourceAPI?: string;
}

export default function SavedMealsScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();

    const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
    const [showModal, setShowModal] = useState(false);

    const fetchSavedRecipes = async () => {
        try {
            const res = await api.savedRecipes.list();
            setRecipes(res.data?.data || []);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load saved meals');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSavedRecipes();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchSavedRecipes();
    }, []);

    const handleUnsave = (recipe: SavedRecipe) => {
        Alert.alert(
            'Remove Saved Meal',
            `Remove "${recipe.name}" from your saved meals?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setRecipes(prev => prev.filter(r => r.id !== recipe.id));
                        try {
                            await api.savedRecipes.unsave(recipe.id);
                        } catch {
                            fetchSavedRecipes();
                            Alert.alert('Error', 'Failed to remove saved meal');
                        }
                    },
                },
            ]
        );
    };

    const handleRecipePress = (recipe: SavedRecipe) => {
        setSelectedRecipe(recipe);
        setShowModal(true);
    };

    const getFallbackImage = () => 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80';

    const parseTags = (tagsStr?: string): string[] => {
        if (!tagsStr) return [];
        try {
            return typeof tagsStr === 'string' ? JSON.parse(tagsStr) : tagsStr;
        } catch {
            return [];
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerBox, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]}>Saved Meals</Text>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''} saved</Text>
                </View>
            </View>

            <ScrollView
                style={styles.list}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {recipes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
                            <Ionicons name="bookmark-outline" size={32} color={theme.textMuted} />
                        </View>
                        <Text style={[styles.emptyText, { color: theme.text }]}>No saved meals yet</Text>
                        <Text style={[styles.emptySubText, { color: theme.textMuted }]}>
                            Save meals from your daily plan to find them here later.
                        </Text>
                    </View>
                ) : (
                    recipes.map((recipe) => {
                        const tags = parseTags(recipe.tags);
                        return (
                            <TouchableOpacity
                                key={recipe.id}
                                style={[styles.recipeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                                onPress={() => handleRecipePress(recipe)}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={{ uri: recipe.image || getFallbackImage() }}
                                    style={styles.recipeImage}
                                />
                                <View style={styles.recipeInfo}>
                                    <Text style={[styles.recipeName, { color: theme.text }]} numberOfLines={2}>
                                        {recipe.name}
                                    </Text>
                                    <View style={styles.recipeMeta}>
                                        {recipe.calories !== undefined && recipe.calories !== null && (
                                            <View style={styles.metaItem}>
                                                <Ionicons name="flame" size={14} color="#ef4444" />
                                                <Text style={[styles.metaText, { color: theme.textMuted }]}>{recipe.calories} kcal</Text>
                                            </View>
                                        )}
                                        {recipe.protein !== undefined && recipe.protein !== null && (
                                            <View style={styles.metaItem}>
                                                <Ionicons name="restaurant" size={14} color="#f59e0b" />
                                                <Text style={[styles.metaText, { color: theme.textMuted }]}>{recipe.protein}g protein</Text>
                                            </View>
                                        )}
                                    </View>
                                    {tags.length > 0 && (
                                        <View style={styles.tagsRow}>
                                            {tags.slice(0, 2).map((tag, i) => (
                                                <View key={i} style={[styles.tagBadge, { backgroundColor: theme.primary + '1A' }]}>
                                                    <Text style={[styles.tagText, { color: theme.primary }]}>{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[styles.unsaveBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                                    onPress={() => handleUnsave(recipe)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="bookmark" size={20} color="#f59e0b" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <RecipeDetailsModal
                visible={showModal}
                onClose={() => {
                    setShowModal(false);
                    fetchSavedRecipes();
                }}
                recipe={selectedRecipe}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerBox: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 40,
    },
    recipeCard: {
        flexDirection: 'row',
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    recipeImage: {
        width: 100,
        height: 100,
    },
    recipeInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    recipeName: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
    },
    recipeMeta: {
        flexDirection: 'row',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    tagBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    unsaveBtn: {
        width: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
