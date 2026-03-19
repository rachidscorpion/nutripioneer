import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../lib/api-client';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ProGate from '../../components/pro/ProGate';

const TABS = [
    { id: 'biometrics', label: 'Body', icon: 'user' },
    { id: 'conditions', label: 'Conditions', icon: 'droplet' },
    { id: 'medical', label: 'Health', icon: 'heart' },
    { id: 'dietary', label: 'Food', icon: 'coffee' },
    { id: 'nutrition', label: 'Nutrition', icon: 'activity' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
];

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { theme, setTheme, selectedTheme: themeContextSelectedTheme } = useTheme();
    const { logout: authLogout } = useAuth();
    const insets = useSafeAreaInsets();

    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState({
        biometrics: { gender: 'female', heightCm: 165, weightKg: 65, waistCm: 70 },
        medical: { insulin: false, medications: [] as any[] },
        dietary: { favorites: [], dislikes: [] as string[], allergies: [] as string[] }
    });

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('biometrics');
    const [selectedTheme, setSelectedTheme] = useState('dark');

    const [availableConditions, setAvailableConditions] = useState<any[]>([]);
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

    // Search
    const [drugQuery, setDrugQuery] = useState('');
    const [drugResults, setDrugResults] = useState<any[]>([]);
    const [isSearchingDrug, setIsSearchingDrug] = useState(false);

    const [conditionQuery, setConditionQuery] = useState('');
    const [conditionResults, setConditionResults] = useState<any[]>([]);
    const [isSearchingCondition, setIsSearchingCondition] = useState(false);

    // Nutrition Limits
    const [nutritionLimits, setNutritionLimits] = useState<any>(null);
    const [isLoadingLimits, setIsLoadingLimits] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await api.user.getProfile();
            if (res.data) {
                const u = res.data.data ? res.data.data : res.data;
                setUser(u);

                if (u.preferences?.theme) {
                    setSelectedTheme(u.preferences.theme);
                    // Sync the backend theme preference into our global ThemeContext
                    // so the rest of the app immediately adopts it.
                    if (themeContextSelectedTheme !== u.preferences.theme) {
                        setTheme(u.preferences.theme);
                    }
                }

                // Parse OnboardingData
                const raw = typeof u.onboardingData === 'string'
                    ? JSON.parse(u.onboardingData)
                    : (u.onboardingData || {});

                setData({
                    biometrics: {
                        gender: raw.biometrics?.gender || 'female',
                        heightCm: raw.biometrics?.heightCm || raw.biometrics?.height || 165,
                        weightKg: raw.biometrics?.weightKg || raw.biometrics?.weight || 65,
                        waistCm: raw.biometrics?.waistCm || raw.biometrics?.waist || 70,
                    },
                    medical: {
                        insulin: raw.medical?.insulin ?? false,
                        medications: raw.medical?.medications || [],
                    },
                    dietary: {
                        favorites: raw.dietary?.favorites || [],
                        dislikes: raw.dietary?.dislikes || [],
                        allergies: raw.dietary?.allergies || [],
                    }
                });

                // Parse conditions
                if (u.conditions) {
                    const parsed = typeof u.conditions === 'string' ? JSON.parse(u.conditions) : u.conditions;
                    if (Array.isArray(parsed)) setSelectedConditions(parsed);
                }
            }

            const condRes = await api.conditions.list();
            if (condRes.data?.data) {
                setAvailableConditions(condRes.data.data);
            }

            // Load Nutrition Limits
            try {
                const limitsRes = await api.user.getNutritionLimits();
                if (limitsRes.data?.data) {
                    setNutritionLimits(limitsRes.data.data);
                }
            } catch (e) {
                console.error("Failed to load nutrition limits", e);
            } finally {
                setIsLoadingLimits(false);
            }

        } catch (e) {
            console.error('Failed to load profile', e);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const finalPayload = {
                ...data,
                conditions: selectedConditions
            };
            await api.user.updateProfile(finalPayload);
            if (nutritionLimits) {
                await api.user.updateNutritionLimits(nutritionLimits);
            }

            Alert.alert('Success', 'Profile updated successfully');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const updateNested = (section: keyof typeof data, field: string, value: any) => {
        setData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleLogout = async () => {
        await authLogout();
        navigation.navigate('Login' as never);
    };

    const handleThemeChange = async (newTheme: string) => {
        setSelectedTheme(newTheme);
        setTheme(newTheme as any);
        try {
            await api.user.updatePreferences({ theme: newTheme });
        } catch (e) {
            console.error('Failed to update theme', e);
            Alert.alert('Error', 'Failed to save theme preference');
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.user.deleteAccount();
                            await AsyncStorage.removeItem('auth_token');
                            navigation.navigate('Login' as never);
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete account. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const searchDrugs = async () => {
        if (!drugQuery.trim()) return;
        setIsSearchingDrug(true);
        try {
            const res = await api.drugs.search(drugQuery);
            setDrugResults(res.data?.results || []);
        } catch (e) {
            Alert.alert('Error', 'Failed to search medications');
        } finally {
            setIsSearchingDrug(false);
        }
    };

    const addDrug = async (drug: any) => {
        try {
            const details = await api.drugs.details(drug.name, drug.rxcui || '');
            const newMeds = [...data.medical.medications];
            if (!newMeds.find(m => m.name === details.data.name)) {
                newMeds.push(details.data);
                updateNested('medical', 'medications', newMeds);
            }
            setDrugQuery('');
            setDrugResults([]);
        } catch (e) {
            Alert.alert('Error', 'Failed to add medication');
        }
    };

    const searchConditions = async () => {
        if (!conditionQuery.trim()) {
            setConditionResults([]);
            return;
        }
        setIsSearchingCondition(true);
        try {
            const res = await api.conditions.search(conditionQuery);
            setConditionResults(res.data?.data || []);
        } catch (e) {
            Alert.alert('Error', 'Failed to search conditions');
        } finally {
            setIsSearchingCondition(false);
        }
    };

    const toggleCondition = (slug: string, fullCondition?: any) => {
        if (selectedConditions.includes(slug)) {
            setSelectedConditions(prev => prev.filter(c => c !== slug));
        } else {
            setSelectedConditions(prev => [...prev, slug]);
            if (fullCondition && !availableConditions.find(c => c.slug === slug)) {
                setAvailableConditions(prev => [...prev, fullCondition]);
            }
            setConditionQuery('');
            setConditionResults([]);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
                <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                    <Text style={[styles.title, { color: theme.text }]}>My Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isSaving} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Profile Info */}
                <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {user?.image ? (
                        <Image source={{ uri: user.image }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: theme.primary }]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    )}
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || 'User'}</Text>
                        <Text style={[styles.profileEmail, { color: theme.textMuted }]}>{user?.email}</Text>
                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, user?.subscriptionStatus === 'active' ? styles.badgePro : styles.badgeStandard]}>
                                <Text style={styles.badgeText}>{user?.subscriptionStatus === 'active' ? 'Pro Member' : 'Standard'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                        {TABS.map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tabBtn, activeTab === tab.id && { borderBottomColor: theme.primary }]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <Feather name={tab.icon as any} size={16} color={activeTab === tab.id ? theme.primary : theme.textMuted} />
                                <Text style={[styles.tabText, { color: activeTab === tab.id ? theme.primary : theme.textMuted }]}>{tab.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tab Content */}
                <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentPadding}>

                    {activeTab === 'biometrics' && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Biometrics</Text>
                            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
                                    <View style={styles.radioGroup}>
                                        {['male', 'female', 'other'].map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[styles.radioBtn, { backgroundColor: theme.background, borderColor: theme.border }, data.biometrics.gender === g && { backgroundColor: theme.primary + '33', borderColor: theme.primary }]}
                                                onPress={() => updateNested('biometrics', 'gender', g)}
                                            >
                                                <Text style={[styles.radioText, data.biometrics.gender === g ? { color: theme.primary } : { color: theme.textMuted }]}>
                                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={[styles.label, { color: theme.text }]}>Height (cm)</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                            keyboardType="numeric"
                                            value={String(data.biometrics.heightCm)}
                                            onChangeText={v => updateNested('biometrics', 'heightCm', parseInt(v) || 0)}
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                        <Text style={[styles.label, { color: theme.text }]}>Weight (kg)</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                            keyboardType="numeric"
                                            value={String(data.biometrics.weightKg)}
                                            onChangeText={v => updateNested('biometrics', 'weightKg', parseInt(v) || 0)}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Waist (cm)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                        keyboardType="numeric"
                                        value={String(data.biometrics.waistCm)}
                                        onChangeText={v => updateNested('biometrics', 'waistCm', parseInt(v) || 0)}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === 'conditions' && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Known Conditions</Text>

                            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Text style={[styles.label, { color: theme.text }]}>Add a new condition</Text>
                                <View style={styles.searchRow}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8, backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                        placeholder="Search conditions..."
                                        placeholderTextColor={theme.textMuted}
                                        value={conditionQuery}
                                        onChangeText={setConditionQuery}
                                        onSubmitEditing={searchConditions}
                                    />
                                    <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.primary }]} onPress={searchConditions} disabled={isSearchingCondition}>
                                        {isSearchingCondition ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="search" size={20} color="#fff" />}
                                    </TouchableOpacity>
                                </View>

                                {conditionResults.length > 0 && (
                                    <View style={[styles.searchResults, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                        {conditionResults.map(c => (
                                            <TouchableOpacity key={c.id} style={[styles.searchResultItem, { borderBottomColor: theme.border }]} onPress={() => toggleCondition(c.slug, c)}>
                                                <Text style={[styles.searchResultText, { color: theme.text }]}>{c.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View style={styles.conditionsGrid}>
                                {availableConditions.filter(c => selectedConditions.includes(c.slug)).map(c => (
                                    <View key={c.id} style={[styles.conditionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                        <TouchableOpacity
                                            style={styles.removeCondBtn}
                                            onPress={() => toggleCondition(c.slug)}
                                        >
                                            <Feather name="x" size={14} color={theme.danger} />
                                        </TouchableOpacity>
                                        <Feather name="alert-circle" size={24} color={c.color || theme.primary} style={{ marginBottom: 8 }} />
                                        <Text style={[styles.conditionText, { color: theme.text, textAlign: 'center' }]} numberOfLines={2}>{c.label}</Text>
                                    </View>
                                ))}
                                {selectedConditions.length === 0 && (
                                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>No conditions selected.</Text>
                                )}
                            </View>
                        </View>
                    )}

                    {activeTab === 'medical' && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Medical Profile</Text>

                            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <View style={styles.switchRow}>
                                    <View>
                                        <Text style={[styles.label, { color: theme.text }]}>Insulin Dependent</Text>
                                        <Text style={[styles.subText, { color: theme.textMuted }]}>Do you take exogenous insulin?</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, data.medical.insulin ? [styles.toggleBtnOn, { backgroundColor: theme.primary }] : [styles.toggleBtnOff, { backgroundColor: theme.textMuted }]]}
                                        onPress={() => updateNested('medical', 'insulin', !data.medical.insulin)}
                                    >
                                        <View style={[styles.toggleKnob, data.medical.insulin ? styles.toggleKnobOn : styles.toggleKnobOff, { backgroundColor: theme.background }]} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16, color: theme.text }]}>Current Medications</Text>
                            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <View style={styles.searchRow}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8, backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                        placeholder="Search medication..."
                                        placeholderTextColor={theme.textMuted}
                                        value={drugQuery}
                                        onChangeText={setDrugQuery}
                                        onSubmitEditing={searchDrugs}
                                    />
                                    <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.primary }]} onPress={searchDrugs} disabled={isSearchingDrug}>
                                        {isSearchingDrug ? <ActivityIndicator size="small" color="#000" /> : <Feather name="search" size={20} color="#000" />}
                                    </TouchableOpacity>
                                </View>

                                {drugResults.length > 0 && (
                                    <View style={[styles.searchResults, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                        {drugResults.map((drug, i) => (
                                            <TouchableOpacity key={i} style={[styles.searchResultItem, { borderBottomColor: theme.border }]} onPress={() => addDrug(drug)}>
                                                <Text style={[styles.searchResultText, { color: theme.text }]}>{drug.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.medicationList}>
                                    {data.medical.medications.map((med, i) => (
                                        <View key={i} style={[styles.medicationItem, { backgroundColor: theme.background }]}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.medName, { color: theme.text }]}>{med.name}</Text>
                                                {med.ingredients && (
                                                    <Text style={[styles.medDesc, { color: theme.textMuted }]}>{Array.isArray(med.ingredients) ? med.ingredients.join(', ') : med.ingredients}</Text>
                                                )}
                                            </View>
                                            <TouchableOpacity onPress={() => {
                                                const newMeds = data.medical.medications.filter((_, idx) => idx !== i);
                                                updateNested('medical', 'medications', newMeds);
                                            }}>
                                                <Feather name="trash-2" size={20} color={theme.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {data.medical.medications.length === 0 && (
                                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No medications listed.</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === 'dietary' && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Dietary Preferences</Text>
                            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Dislikes (comma separated)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                        value={data.dietary.dislikes.join(', ')}
                                        onChangeText={v => updateNested('dietary', 'dislikes', v.split(',').map(s => s.trim()).filter(Boolean))}
                                        placeholder="e.g. Cilantro, Mushrooms"
                                        placeholderTextColor={theme.textMuted}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Allergies (comma separated)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                        value={data.dietary.allergies.join(', ')}
                                        onChangeText={v => updateNested('dietary', 'allergies', v.split(',').map(s => s.trim()).filter(Boolean))}
                                        placeholder="e.g. Peanuts, Shellfish"
                                        placeholderTextColor={theme.textMuted}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === 'nutrition' && (
                        <ProGate
                            isPro={user?.subscriptionStatus === 'active'}
                            feature="Nutrition Limits"
                            description="Customize your daily calorie and nutrient targets based on your dietitian's recommendations"
                            benefits={[
                                "Override AI-generated limits",
                                "Set custom min/max values for all nutrients",
                                "Adjust targets based on medical advice"
                            ]}
                            mode="readonly"
                        >
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Nutrition Limits</Text>
                                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primary + '33', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                            <Feather name="shield" size={16} color={theme.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>Medical Nutrition Therapy</Text>
                                            <Text style={{ fontSize: 12, color: theme.textMuted }}>
                                                Customize your daily calorie and nutrient targets based on your dietitian's recommendations.
                                            </Text>
                                        </View>
                                    </View>

                                    {isLoadingLimits ? (
                                        <ActivityIndicator size="small" color={theme.primary} />
                                    ) : !nutritionLimits ? (
                                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No nutrition limits generated yet. Complete your profile to generate them.</Text>
                                    ) : (
                                        <View>
                                            <View style={{ marginBottom: 24 }}>
                                                <Text style={[styles.label, { fontSize: 16, color: theme.text }]}>Daily Calories</Text>
                                                <View style={styles.row}>
                                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                                        <Text style={[styles.label, { color: theme.text }]}>Min (kcal)</Text>
                                                        <TextInput
                                                            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                                            keyboardType="numeric"
                                                            value={String(nutritionLimits.daily_calories.min || '')}
                                                            onChangeText={(v) => setNutritionLimits({
                                                                ...nutritionLimits,
                                                                daily_calories: { ...nutritionLimits.daily_calories, min: parseInt(v) || 0 }
                                                            })}
                                                        />
                                                    </View>
                                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                                        <Text style={[styles.label, { color: theme.text }]}>Max (kcal)</Text>
                                                        <TextInput
                                                            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                                            keyboardType="numeric"
                                                            value={String(nutritionLimits.daily_calories.max || '')}
                                                            onChangeText={(v) => setNutritionLimits({
                                                                ...nutritionLimits,
                                                                daily_calories: { ...nutritionLimits.daily_calories, max: parseInt(v) || 0 }
                                                            })}
                                                        />
                                                    </View>
                                                </View>
                                            </View>

                                            {Object.entries(nutritionLimits.nutrients).map(([key, limit]: [string, any]) => {
                                                if (limit.max === undefined && limit.min === undefined) return null;

                                                return (
                                                    <View key={key} style={{ marginBottom: 16 }}>
                                                        <Text style={[styles.label, { fontSize: 14, color: theme.text }]}>
                                                            {limit.label || key} <Text style={{ color: theme.textMuted, fontSize: 12 }}>({limit.unit})</Text>
                                                        </Text>
                                                        <View style={styles.row}>
                                                            {limit.min !== undefined && (
                                                                <View style={[styles.inputGroup, { flex: 1, marginRight: limit.max !== undefined ? 8 : 0 }]}>
                                                                    <Text style={[styles.label, { color: theme.text }]}>Min</Text>
                                                                    <TextInput
                                                                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                                                        keyboardType="numeric"
                                                                        value={String(limit.min || '')}
                                                                        onChangeText={(v) => setNutritionLimits({
                                                                            ...nutritionLimits,
                                                                            nutrients: {
                                                                                ...nutritionLimits.nutrients,
                                                                                [key]: { ...limit, min: parseInt(v) || 0 }
                                                                            }
                                                                        })}
                                                                    />
                                                                </View>
                                                            )}
                                                            {limit.max !== undefined && (
                                                                <View style={[styles.inputGroup, { flex: 1, marginLeft: limit.min !== undefined ? 8 : 0 }]}>
                                                                    <Text style={[styles.label, { color: theme.text }]}>Max</Text>
                                                                    <TextInput
                                                                        style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                                                                        keyboardType="numeric"
                                                                        value={String(limit.max || '')}
                                                                        onChangeText={(v) => setNutritionLimits({
                                                                            ...nutritionLimits,
                                                                            nutrients: {
                                                                                ...nutritionLimits.nutrients,
                                                                                [key]: { ...limit, max: parseInt(v) || 0 }
                                                                            }
                                                                        })}
                                                                    />
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </ProGate>
                    )}

                    {activeTab === 'settings' && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>App Preferences</Text>

                            <View style={[styles.card, { marginBottom: 24, backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Text style={[styles.label, { fontSize: 16, color: theme.text, marginBottom: 12 }]}>Color Theme</Text>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    {['light', 'dark', 'system'].map(t => (
                                        <TouchableOpacity
                                            key={t}
                                            style={[
                                                styles.radioBtn,
                                                { backgroundColor: theme.background, borderColor: theme.border, paddingVertical: 12 },
                                                selectedTheme === t && { backgroundColor: theme.primary + '33', borderColor: theme.primary }
                                            ]}
                                            onPress={() => handleThemeChange(t)}
                                        >
                                            <Text style={[styles.radioText, selectedTheme === t ? { color: theme.primary } : { color: theme.textMuted }, { textTransform: 'capitalize' }]}>
                                                {t}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Management</Text>

                            <TouchableOpacity style={[styles.logoutBtn, { marginBottom: 16 }]} onPress={handleLogout}>
                                <Feather name="log-out" size={18} color="#000" />
                                <Text style={styles.logoutBtnText}>Log Out</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.danger + '1A', borderWidth: 1, borderColor: theme.danger }]} onPress={handleDeleteAccount}>
                                <Feather name="trash-2" size={18} color={theme.danger} />
                                <Text style={[styles.logoutBtnText, { color: theme.danger }]}>Delete Account</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    saveBtn: {
        backgroundColor: '#10b981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 20,
    },
    avatarFallback: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#a1a1aa',
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgePro: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    badgeStandard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    badgeText: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '600',
    },
    tabContainer: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    tabScroll: {
        paddingHorizontal: 16,
    },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabBtnActive: {
        borderBottomColor: '#10b981',
    },
    tabText: {
        color: '#a1a1aa',
        marginLeft: 8,
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#10b981',
    },
    contentContainer: {
        flex: 1,
    },
    contentPadding: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#e4e4e7',
        fontWeight: '500',
        marginBottom: 8,
    },
    subText: {
        fontSize: 12,
        color: '#a1a1aa',
        marginTop: 4,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 12,
        color: '#fff',
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    radioBtn: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        alignItems: 'center',
    },
    radioBtnActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
    },
    radioText: {
        color: '#a1a1aa',
        fontSize: 14,
        fontWeight: '500',
    },
    radioTextActive: {
        color: '#10b981',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleBtn: {
        width: 50,
        height: 28,
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center',
    },
    toggleBtnOn: {
        backgroundColor: '#10b981',
    },
    toggleBtnOff: {
        backgroundColor: '#3f3f46',
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    toggleKnobOn: {
        transform: [{ translateX: 22 }],
    },
    toggleKnobOff: {
        transform: [{ translateX: 0 }],
    },
    searchRow: {
        flexDirection: 'row',
    },
    searchBtn: {
        backgroundColor: '#10b981',
        width: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    searchResults: {
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        marginTop: 8,
        maxHeight: 150,
    },
    searchResultItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    searchResultText: {
        color: '#fff',
        fontSize: 14,
    },
    conditionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
        gap: 8,
    },
    conditionCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        position: 'relative',
    },
    removeCondBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
    },
    conditionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyText: {
        color: '#a1a1aa',
        fontStyle: 'italic',
        marginTop: 8,
    },
    medicationList: {
        marginTop: 16,
    },
    medicationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    medName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    medDesc: {
        color: '#a1a1aa',
        fontSize: 12,
    },
    logoutBtn: {
        flexDirection: 'row',
        backgroundColor: '#13ec5b',
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    logoutBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

