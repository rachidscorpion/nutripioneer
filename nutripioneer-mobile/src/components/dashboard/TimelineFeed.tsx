import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MealCard from '../cards/MealCard';
import WorkoutCard from '../cards/WorkoutCard';

interface TimelineFeedProps {
    plan: any;
    nutritionLimits?: any;
    onRefresh?: () => void;
}

function formatTime(time24: string) {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${suffix}`;
}

export default function TimelineFeed({ plan, nutritionLimits, onRefresh }: TimelineFeedProps) {
    return (
        <View style={styles.container}>
            {/* Breakfast */}
            <View style={styles.feedItem}>
                <View style={[styles.timelineDot, styles.dotBlue]} />
                <Text style={styles.timeLabel}>{formatTime(plan.breakfastTime || "08:00")}</Text>
                <MealCard
                    meal={plan.breakfast}
                    type="breakfast"
                    planId={plan.id}
                    status={plan.breakfastStatus}
                    nutritionLimits={nutritionLimits}
                    onUpdate={onRefresh}
                />
            </View>

            {/* Workout */}
            <View style={styles.feedItem}>
                <View style={[styles.timelineDot, styles.dotPurple]} />
                <Text style={styles.timeLabel}>{formatTime(plan.workoutTime || "10:00")}</Text>
                <WorkoutCard />
            </View>

            {/* Lunch */}
            <View style={styles.feedItem}>
                <View style={[styles.timelineDot, styles.dotEmerald]} />
                <Text style={styles.timeLabel}>{formatTime(plan.lunchTime || "13:00")}</Text>
                <MealCard
                    meal={plan.lunch}
                    type="lunch"
                    planId={plan.id}
                    status={plan.lunchStatus}
                    nutritionLimits={nutritionLimits}
                    onUpdate={onRefresh}
                />
            </View>

            {/* Dinner */}
            <View style={styles.feedItem}>
                <View style={[styles.timelineDot, styles.dotAmber]} />
                <Text style={styles.timeLabel}>{formatTime(plan.dinnerTime || "18:00")}</Text>
                <MealCard
                    meal={plan.dinner}
                    type="dinner"
                    planId={plan.id}
                    status={plan.dinnerStatus}
                    nutritionLimits={nutritionLimits}
                    onUpdate={onRefresh}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 100, // accommodate tab bar
    },
    feedItem: {
        marginBottom: 32,
        position: 'relative',
        paddingLeft: 24,
    },
    timelineDot: {
        position: 'absolute',
        left: 0,
        top: 4,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#121212',
        zIndex: 1,
    },
    dotBlue: { backgroundColor: '#3b82f6' },
    dotPurple: { backgroundColor: '#8b5cf6' },
    dotEmerald: { backgroundColor: '#13ec5b' },
    dotAmber: { backgroundColor: '#f59e0b' },
    timeLabel: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    }
});
