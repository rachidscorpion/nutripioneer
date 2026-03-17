import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api-client';
import RecipeDetailsModal from '../modals/RecipeDetailsModal';

interface MealCardProps {
    meal: any;
    type: 'breakfast' | 'lunch' | 'dinner';
    planId: string;
    status?: string;
    nutritionLimits?: any;
    onUpdate?: () => void;
}

export default function MealCard({ meal, type, planId, status = 'PENDING', nutritionLimits, onUpdate }: MealCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isCompleted = status === 'COMPLETED';

    const handleToggle = async () => {
        const newStatus = isCompleted ? 'PENDING' : 'COMPLETED';
        setIsLoading(true);
        try {
            await api.plans.updateStatus(planId, type, newStatus);
            onUpdate?.();
        } catch (e) {
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Remove Meal', 'Are you sure you want to remove this meal?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    setIsLoading(true);
                    try {
                        if (planId && type) {
                            await api.plans.removeMeal(planId, type);
                            onUpdate?.();
                        } else {
                            throw new Error('Missing planId or type');
                        }
                    } catch (e: any) {
                        console.error("Failed to remove meal", e);
                        Alert.alert('Error', e.response?.data?.message || 'Failed to remove meal');
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        ]);
    };

    const handleSwap = async () => {
        setIsLoading(true);
        try {
            await api.meals.swap(planId, type);
            onUpdate?.();
        } catch (e) {
            Alert.alert('Error', 'Failed to swap meal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        setIsLoading(true);
        try {
            await api.meals.swap(planId, type);
            onUpdate?.();
        } catch (e) {
            Alert.alert('Error', 'Failed to add meal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToGrocery = async () => {
        setIsLoading(true);
        try {
            let parsedIngredients = [];
            try {
                parsedIngredients = typeof meal.ingredients === 'string'
                    ? JSON.parse(meal.ingredients)
                    : meal.ingredients || [];
            } catch (e) {
                console.log("Failed to parse ingredients", e);
                Alert.alert('Info', 'No ingredients found');
                setIsLoading(false);
                return;
            }

            const ingredientsPayload = parsedIngredients.map((i: any) =>
                i.measure ? `${i.item} (${i.measure})` : i.item || i
            );

            if (ingredientsPayload.length > 0) {
                await api.grocery.addIngredients(ingredientsPayload);
                Alert.alert('Success', 'Items added to grocery list');
            } else {
                Alert.alert('Info', 'No ingredients to add');
            }
        } catch (e) {
            console.error("Failed to add groceries", e);
            Alert.alert('Error', 'Failed to add ingredients');
        } finally {
            setIsLoading(false);
        }
    };

    const [imgSrc, setImgSrc] = useState(meal?.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Update image when meal changes
    useEffect(() => {
        setImgSrc(meal?.image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80');
    }, [meal]);

    if (!meal) {
        return (
            <View style={[styles.card, styles.emptyCard]}>
                <Text style={styles.emptyText}>No meal assigned</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator size="small" color="#13ec5b" /> : (
                        <>
                            <Ionicons name="add-circle-outline" size={18} color="#13ec5b" />
                            <Text style={styles.addBtnText}>Add Meal</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    let tags: string[] = [];
    try {
        tags = typeof meal.tags === 'string' ? JSON.parse(meal.tags) : meal.tags || [];
    } catch (e) { }

    const isDiabeticSafe = tags.includes('Low-GI') || tags.includes('Low-Carb');
    const isHeartSafe = tags.includes('DASH') || tags.includes('Low-Sodium');

    return (
        <View style={styles.card}>
            <Image
                source={{ uri: imgSrc }}
                style={styles.image}
                onError={() => setImgSrc('https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80')}
            />
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{meal.name}</Text>
                <Text style={styles.description} numberOfLines={2}>{meal.description}</Text>

                <View style={styles.tagsContainer}>
                    <View style={styles.badge}><Text style={styles.badgeText}>{meal.calories} kcal</Text></View>
                    {meal.prepTime > 0 && (
                        <View style={styles.badge}>
                            <Ionicons name="time-outline" size={12} color="#a1a1aa" style={{ marginRight: 4 }} />
                            <Text style={styles.badgeText}>{meal.prepTime > 999 ? meal.prepTime / 60 : meal.prepTime} min</Text>
                        </View>
                    )}
                    <View style={styles.badge}><Text style={styles.badgeText}>{meal.protein}g P</Text></View>
                    {isDiabeticSafe && <View style={[styles.badge, styles.badgeGreen]}><Text style={styles.badgeGreenText}>Glucose Friendly</Text></View>}
                    {isHeartSafe && <View style={[styles.badge, styles.badgeGreen]}><Text style={styles.badgeGreenText}>Heart Healthy</Text></View>}
                </View>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#13ec5b" />
                    </View>
                )}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.btnPrimary} disabled={isLoading} onPress={() => setIsModalOpen(true)}>
                    <Ionicons name="restaurant" size={16} color="#000" />
                    <Text style={styles.btnPrimaryText}>{isCompleted ? 'View Recipe' : 'Cook'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btnGhost, isCompleted && styles.btnCompleted]}
                    onPress={handleToggle}
                    disabled={isLoading}
                >
                    <Ionicons name={isCompleted ? "checkbox" : "square-outline"} size={20} color={isCompleted ? "#13ec5b" : "#d1d5db"} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.btnGhost}
                    onPress={handleSwap}
                    disabled={isLoading || isCompleted}
                >
                    <Ionicons name="refresh" size={20} color={isCompleted ? "#4b5563" : "#d1d5db"} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.btnGhost}
                    onPress={handleDelete}
                    disabled={isLoading}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnGhost} onPress={handleAddToGrocery} disabled={isLoading}>
                    <Ionicons name="cart-outline" size={20} color="#d1d5db" />
                </TouchableOpacity>
            </View>

            <RecipeDetailsModal
                visible={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                recipe={meal}
                nutritionLimits={nutritionLimits}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1c1c1e',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2a2a2a',
        marginBottom: 16,
    },
    emptyCard: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderColor: '#333',
        backgroundColor: 'transparent',
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
        marginBottom: 12,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.3)',
    },
    addBtnText: {
        color: '#13ec5b',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    image: {
        width: '100%',
        height: 160,
        backgroundColor: '#2a2a2a',
    },
    content: {
        padding: 16,
        position: 'relative',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 12,
        lineHeight: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#a1a1aa',
        fontSize: 12,
        fontWeight: '500',
    },
    badgeGreen: {
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderColor: 'rgba(19, 236, 91, 0.3)',
        borderWidth: 1,
    },
    badgeGreenText: {
        color: '#13ec5b',
        fontSize: 12,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#2a2a2a',
        backgroundColor: '#1a1a1c',
        gap: 8,
    },
    btnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#13ec5b',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    btnPrimaryText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnGhost: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: '#2a2a2a',
    },
    btnCompleted: {
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderColor: 'rgba(19, 236, 91, 0.3)',
        borderWidth: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(28, 28, 30, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    }
});
