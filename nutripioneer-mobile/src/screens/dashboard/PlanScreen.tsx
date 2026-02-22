import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api-client';
import MealCard from '../../components/cards/MealCard';
import WorkoutCard from '../../components/cards/WorkoutCard';
import TimePicker from '../../components/ui/TimePicker';

export default function PlanScreen() {
    const [currentDate, setCurrentDate] = useState<Date>(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const [plan, setPlan] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [times, setTimes] = useState({
        breakfast: "08:00",
        lunch: "13:00",
        dinner: "18:00",
        workout: "10:00",
    });

    const fetchPlan = useCallback(async (date: Date) => {
        setIsLoading(true);
        try {
            // Using ISO string to map to YYYY-MM-DD that backend expects
            const apiDate = new Date(date);
            apiDate.setUTCHours(12, 0, 0, 0);

            const res = await api.plans.getDaily(apiDate.toISOString());
            if (res.data?.success) {
                const planData = res.data.data;
                setPlan(planData);
                if (planData) {
                    setTimes({
                        breakfast: planData.breakfastTime || "08:00",
                        lunch: planData.lunchTime || "13:00",
                        dinner: planData.dinnerTime || "18:00",
                        workout: planData.workoutTime || "10:00",
                    });
                }
            } else {
                setPlan(null);
            }
        } catch (error: any) {
            if (error.response?.status !== 404) {
                console.error("Failed to fetch plan", error);
                // Don't alert on 404, just means no plan
            }
            setPlan(null);
        } finally {
            setIsLoading(false);
        }
    }, [currentDate]); // add currentDate to dependency so it doesn't cause stale closure if ever used

    useEffect(() => {
        fetchPlan(currentDate);
    }, [currentDate, fetchPlan]);

    const handleDateChange = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const apiDate = new Date(currentDate);
            apiDate.setUTCHours(12, 0, 0, 0);
            await api.plans.generate(apiDate.toISOString());
            await fetchPlan(currentDate);
        } catch (e) {
            Alert.alert('Error', 'Failed to generate plan');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Delete Plan', 'Are you sure you want to delete this plan?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    setIsDeleting(true);
                    try {
                        const apiDate = new Date(currentDate);
                        apiDate.setUTCHours(12, 0, 0, 0);
                        await api.plans.delete(apiDate.toISOString());
                        setPlan(null);
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete plan');
                    } finally {
                        setIsDeleting(false);
                    }
                }
            }
        ]);
    };

    const handleTimeChange = async (key: string, value: string) => {
        if (!plan) return;

        setTimes(prev => ({ ...prev, [key]: value }));

        try {
            const dbKeyMap: Record<string, string> = {
                breakfast: 'breakfastTime',
                lunch: 'lunchTime',
                dinner: 'dinnerTime',
                workout: 'workoutTime'
            };

            await api.plans.update(plan.id, {
                [dbKeyMap[key]]: value
            });
        } catch (error) {
            console.error('Failed to update time', error);
        }
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            return 'Today';
        }

        return date.toLocaleDateString('en-US', { weekday: 'long' });
    };

    const formatFullDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const isFutureOrToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return currentDate >= today;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerTitles}>
                    <Text style={styles.title}>Daily Plan</Text>
                    <Text style={styles.subtitle}>Manage your schedule and meals.</Text>
                </View>

                <View style={styles.headerControls}>
                    {plan && (
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={handleDelete}
                            disabled={isDeleting || isLoading}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.dateNavigator}>
                <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => handleDateChange(-1)}
                    disabled={isLoading}
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.dateDisplay}>
                    <Text style={styles.dayLabel}>{formatDate(currentDate)}</Text>
                    <Text style={styles.dateValue}>{formatFullDate(currentDate)}</Text>
                </View>

                <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => handleDateChange(1)}
                    disabled={isLoading}
                >
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading && !isGenerating}
                        onRefresh={() => fetchPlan(currentDate)}
                        tintColor="#13ec5b"
                    />
                }
            >
                {!plan && !isLoading ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrapper}>
                            <Ionicons name="sparkles" size={40} color="#13ec5b" />
                        </View>
                        <Text style={styles.emptyTitle}>No Plan Found</Text>

                        {isFutureOrToday() ? (
                            <>
                                <Text style={styles.emptyText}>
                                    You haven't generated a plan for this day yet.{"\n"}
                                    Create one now based on your preferences.
                                </Text>
                                <TouchableOpacity
                                    style={styles.generateBtn}
                                    onPress={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <ActivityIndicator size="small" color="#000" />
                                    ) : (
                                        <>
                                            <Ionicons name="sparkles" size={20} color="#000" />
                                            <Text style={styles.generateBtnText}>Generate Plan</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.pastDateWarning}>
                                <Ionicons name="information-circle-outline" size={20} color="#ef4444" />
                                <Text style={styles.pastDateWarningText}>Cannot generate plans for past dates.</Text>
                            </View>
                        )}
                    </View>
                ) : plan ? (
                    <View style={styles.timeline}>
                        {/* Timeline Line */}
                        <View style={styles.timelineLine} />

                        {/* Breakfast */}
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.dotBlue]} />
                            <View style={styles.timelineHeader}>
                                <Text style={[styles.timelineTitle, styles.textBlue]}>Breakfast</Text>
                                <TimePicker
                                    value={times.breakfast}
                                    onChange={(val) => handleTimeChange('breakfast', val)}
                                />
                            </View>
                            <MealCard
                                meal={plan.breakfast}
                                type="breakfast"
                                planId={plan.id}
                                status={plan.breakfastStatus}
                                onUpdate={() => fetchPlan(currentDate)}
                            />
                        </View>

                        {/* Workout */}
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.dotPurple]} />
                            <View style={styles.timelineHeader}>
                                <Text style={[styles.timelineTitle, styles.textPurple]}>Movement</Text>
                                <TimePicker
                                    value={times.workout}
                                    onChange={(val) => handleTimeChange('workout', val)}
                                />
                            </View>
                            <WorkoutCard />
                        </View>

                        {/* Lunch */}
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.dotEmerald]} />
                            <View style={styles.timelineHeader}>
                                <Text style={[styles.timelineTitle, styles.textEmerald]}>Lunch</Text>
                                <TimePicker
                                    value={times.lunch}
                                    onChange={(val) => handleTimeChange('lunch', val)}
                                />
                            </View>
                            <MealCard
                                meal={plan.lunch}
                                type="lunch"
                                planId={plan.id}
                                status={plan.lunchStatus}
                                onUpdate={() => fetchPlan(currentDate)}
                            />
                        </View>

                        {/* Dinner */}
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.dotAmber]} />
                            <View style={styles.timelineHeader}>
                                <Text style={[styles.timelineTitle, styles.textAmber]}>Dinner</Text>
                                <TimePicker
                                    value={times.dinner}
                                    onChange={(val) => handleTimeChange('dinner', val)}
                                />
                            </View>
                            <MealCard
                                meal={plan.dinner}
                                type="dinner"
                                planId={plan.id}
                                status={plan.dinnerStatus}
                                onUpdate={() => fetchPlan(currentDate)}
                            />
                        </View>

                        {/* Extra spacing at the bottom of the timeline */}
                        <View style={{ height: 40 }} />
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    headerTitles: {
        flex: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#a1a1aa',
    },
    headerControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteBtn: {
        padding: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    dateNavigator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 20,
        backgroundColor: '#1c1c1e',
        marginHorizontal: 16,
        borderRadius: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    navBtn: {
        padding: 8,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
    },
    dateDisplay: {
        alignItems: 'center',
    },
    dayLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateValue: {
        color: '#a1a1aa',
        fontSize: 13,
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // For bottom tabs
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.3)',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 15,
        color: '#a1a1aa',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#13ec5b',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    generateBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    pastDateWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        gap: 8,
    },
    pastDateWarningText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '500',
    },
    timeline: {
        position: 'relative',
        marginLeft: 12,
    },
    timelineLine: {
        position: 'absolute',
        top: 24,
        bottom: 0,
        left: 0,
        width: 2,
        backgroundColor: '#2a2a2a',
        zIndex: 0,
    },
    timelineItem: {
        marginBottom: 32,
        paddingLeft: 24,
        position: 'relative',
    },
    timelineDot: {
        position: 'absolute',
        left: -5,
        top: 6,
        width: 12,
        height: 12,
        borderRadius: 6,
        zIndex: 1,
        borderWidth: 2,
        backgroundColor: '#121212',
    },
    dotBlue: { borderColor: '#3b82f6' },
    dotPurple: { borderColor: '#a855f7' },
    dotEmerald: { borderColor: '#10b981' },
    dotAmber: { borderColor: '#f59e0b' },
    textBlue: { color: '#3b82f6' },
    textPurple: { color: '#a855f7' },
    textEmerald: { color: '#10b981' },
    textAmber: { color: '#f59e0b' },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    timelineTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
