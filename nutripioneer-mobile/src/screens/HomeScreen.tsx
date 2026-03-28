import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, RefreshControl, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api-client';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TimelineFeed from '../components/dashboard/TimelineFeed';
import FoodCheckModal from '../components/modals/FoodCheckModal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user, refreshUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [plan, setPlan] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const fetchData = async () => {
        try {
            setError(null);
            await refreshUser();
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

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

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
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
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
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <DashboardHeader
                onSearchPress={() => setIsFoodModalOpen(true)}
                onMenuPress={() => setIsMenuOpen(true)}
            />

            {/* Menu Dropdown */}
            <Modal
                visible={isMenuOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsMenuOpen(false)}
            >
                <Pressable style={styles.menuOverlay} onPress={() => setIsMenuOpen(false)}>
                    <View style={[styles.menuDropdown, { backgroundColor: theme.card, borderColor: theme.border, top: Math.max(insets.top, 20) + 48 }]}>
                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: theme.border }]}
                            onPress={() => {
                                setIsMenuOpen(false);
                                navigation.navigate('Plan');
                            }}
                        >
                            <Ionicons name="calendar-outline" size={18} color={theme.text} />
                            <Text style={[styles.menuItemText, { color: theme.text }]}>Edit Plan</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={'#13ec5b'} />
                }
            >
                {error ? (
                    <View style={styles.centerContainer}>
                        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
                    </View>
                ) : !plan ? (
                    <View style={styles.centerContainer}>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Plan Today</Text>
                        <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>Generate a meal plan to stay on track.</Text>
                        <TouchableOpacity style={[styles.generateBtn, { backgroundColor: theme.primary }]} onPress={handleGeneratePlan}>
                            <Text style={styles.generateBtnText}>Generate Plan</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TimelineFeed plan={plan} nutritionLimits={nutritionLimits} onRefresh={fetchData} />
                )}

                <View style={[styles.footerLinks, { marginTop: 40, paddingBottom: 120 }]}>
                    <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
                        <Text style={[styles.footerText, { color: theme.textMuted }]}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <Text style={{ color: theme.textMuted, marginHorizontal: 12 }}>•</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                        <Text style={[styles.footerText, { color: theme.textMuted }]}>Terms & Conditions</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <FoodCheckModal
                isOpen={isFoodModalOpen}
                onClose={() => setIsFoodModalOpen(false)}
                planId={plan?.id}
                isPro={user?.subscriptionStatus === 'active'}
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
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    menuDropdown: {
        position: 'absolute',
        right: 20,
        minWidth: 180,
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

