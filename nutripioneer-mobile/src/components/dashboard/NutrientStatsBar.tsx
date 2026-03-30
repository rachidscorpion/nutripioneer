import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface NutrientStatsBarProps {
    plan: any;
}

export default function NutrientStatsBar({ plan }: NutrientStatsBarProps) {
    const { theme } = useTheme();

    if (!plan) return null;

    const meals = [plan.breakfast, plan.lunch, plan.dinner].filter(Boolean);

    const totals = meals.reduce((acc, meal) => {
        acc.calories += (meal.calories || 0);
        acc.protein += (meal.protein || 0);
        acc.carbs += (meal.carbs || 0);
        return acc;
    }, { calories: 0, protein: 0, carbs: 0 });

    const stats = [
        { label: 'Calories', value: `${Math.round(totals.calories)} kcal`, icon: 'flame', color: '#ef4444' },
        { label: 'Protein', value: `${Math.round(totals.protein)}g`, icon: 'fitness', color: theme.primary },
        { label: 'Carbs', value: `${Math.round(totals.carbs)}g`, icon: 'flash', color: '#3b82f6' },
    ];

    return (
        <View style={styles.container}>
            <View style={[styles.bar, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {stats.map((stat, index) => (
                    <React.Fragment key={stat.label}>
                        <View style={styles.statItem}>
                            <View style={[styles.iconContainer, { backgroundColor: stat.color + '1A' }]}>
                                <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
                            </View>
                        </View>
                        {index < stats.length - 1 && (
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        )}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 4,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        width: 1,
        height: 24,
        marginHorizontal: 8,
    }
});
