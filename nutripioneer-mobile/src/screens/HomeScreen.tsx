import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../lib/api-client';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TimelineFeed from '../components/dashboard/TimelineFeed';
import FoodCheckModal from '../components/modals/FoodCheckModal';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [plan, setPlan] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setError(null);
            const profileRes = await api.user.getProfile();
            setUserProfile(profileRes.data.data);

            const today = new Date().toISOString();
            try {
                const planRes = await api.plans.getDaily(today);
                if (planRes.data?.data) {
                    setPlan(planRes.data.data);
                }
            } catch (err: any) {
                // Not found, 404 meaning no plan
                if (err?.response?.status !== 404) {
                    throw err;
                }
            }
        } catch (e) {
            console.error(e);
            setError('Failed to load data. Please try again.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchData();
    }, []);

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        try {
            const today = new Date().toISOString();
            await api.plans.generate(today);
            await fetchData();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to generate plan. Please try again.');
            setIsLoading(false);
        }
    };

    if (isLoading && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#13ec5b" />
            </View>
        );
    }

    let nutritionLimits = null;
    if (userProfile?.nutritionLimits) {
        try {
            nutritionLimits = typeof userProfile.nutritionLimits === 'string'
                ? JSON.parse(userProfile.nutritionLimits)
                : userProfile.nutritionLimits;
        } catch (e) { }
    }

    return (
        <View style={styles.container}>
            <DashboardHeader onSearchPress={() => setIsFoodModalOpen(true)} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#13ec5b" />
                }
            >
                {error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : !plan ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyTitle}>No Plan Today</Text>
                        <Text style={styles.emptyDesc}>Generate a meal plan to stay on track.</Text>
                        <TouchableOpacity style={styles.generateBtn} onPress={handleGeneratePlan}>
                            <Text style={styles.generateBtnText}>Generate Plan</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TimelineFeed plan={plan} nutritionLimits={nutritionLimits} onRefresh={fetchData} />
                )}
            </ScrollView>
            <FoodCheckModal
                isOpen={isFoodModalOpen}
                onClose={() => setIsFoodModalOpen(false)}
                planId={plan?.id}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyDesc: {
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 20,
    },
    generateBtn: {
        backgroundColor: '#13ec5b',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
    },
    generateBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

