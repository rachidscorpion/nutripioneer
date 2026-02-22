import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../lib/api-client';

const TABS = [
    { id: 'biometrics', label: 'Body', icon: 'user' },
    { id: 'conditions', label: 'Conditions', icon: 'droplet' },
    { id: 'medical', label: 'Health', icon: 'heart' },
    { id: 'dietary', label: 'Food', icon: 'coffee' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
];

export default function ProfileScreen() {
    const navigation = useNavigation();

    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState({
        biometrics: { gender: 'female', heightCm: 165, weightKg: 65, waistCm: 70 },
        medical: { insulin: false, medications: [] as any[] },
        dietary: { favorites: [], dislikes: [] as string[], allergies: [] as string[] }
    });

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('biometrics');

    const [availableConditions, setAvailableConditions] = useState<any[]>([]);
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

    // Search
    const [drugQuery, setDrugQuery] = useState('');
    const [drugResults, setDrugResults] = useState<any[]>([]);
    const [isSearchingDrug, setIsSearchingDrug] = useState(false);

    const [conditionQuery, setConditionQuery] = useState('');
    const [conditionResults, setConditionResults] = useState<any[]>([]);
    const [isSearchingCondition, setIsSearchingCondition] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await api.user.getProfile();
            if (res.data) {
                const u = res.data;
                setUser(u);

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
        await AsyncStorage.removeItem('auth_token');
        navigation.navigate('Login' as never);
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
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveBtn}>
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Profile Info */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarFallback}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                        <Text style={styles.profileEmail}>{user?.email}</Text>
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
                                style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <Feather name={tab.icon as any} size={16} color={activeTab === tab.id ? '#10b981' : '#a1a1aa'} />
                                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tab Content */}
                <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentPadding}>

                    {activeTab === 'biometrics' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Biometrics</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Gender</Text>
                                    <View style={styles.radioGroup}>
                                        {['male', 'female', 'other'].map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[styles.radioBtn, data.biometrics.gender === g && styles.radioBtnActive]}
                                                onPress={() => updateNested('biometrics', 'gender', g)}
                                            >
                                                <Text style={[styles.radioText, data.biometrics.gender === g && styles.radioTextActive]}>
                                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.label}>Height (cm)</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            value={String(data.biometrics.heightCm)}
                                            onChangeText={v => updateNested('biometrics', 'heightCm', parseInt(v) || 0)}
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                        <Text style={styles.label}>Weight (kg)</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            value={String(data.biometrics.weightKg)}
                                            onChangeText={v => updateNested('biometrics', 'weightKg', parseInt(v) || 0)}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Waist (cm)</Text>
                                    <TextInput
                                        style={styles.input}
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
                            <Text style={styles.sectionTitle}>Known Conditions</Text>

                            <View style={styles.card}>
                                <Text style={styles.label}>Add a new condition</Text>
                                <View style={styles.searchRow}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                                        placeholder="Search conditions..."
                                        placeholderTextColor="#666"
                                        value={conditionQuery}
                                        onChangeText={setConditionQuery}
                                        onSubmitEditing={searchConditions}
                                    />
                                    <TouchableOpacity style={styles.searchBtn} onPress={searchConditions} disabled={isSearchingCondition}>
                                        {isSearchingCondition ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="search" size={20} color="#fff" />}
                                    </TouchableOpacity>
                                </View>

                                {conditionResults.length > 0 && (
                                    <View style={styles.searchResults}>
                                        {conditionResults.map(c => (
                                            <TouchableOpacity key={c.id} style={styles.searchResultItem} onPress={() => toggleCondition(c.slug, c)}>
                                                <Text style={styles.searchResultText}>{c.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View style={styles.conditionsGrid}>
                                {availableConditions.filter(c => selectedConditions.includes(c.slug)).map(c => (
                                    <View key={c.id} style={styles.conditionCard}>
                                        <TouchableOpacity
                                            style={styles.removeCondBtn}
                                            onPress={() => toggleCondition(c.slug)}
                                        >
                                            <Feather name="x" size={14} color="#ef4444" />
                                        </TouchableOpacity>
                                        <Feather name="alert-circle" size={24} color={c.color || '#3b82f6'} style={{ marginBottom: 8 }} />
                                        <Text style={[styles.conditionText, { textAlign: 'center' }]} numberOfLines={2}>{c.label}</Text>
                                    </View>
                                ))}
                                {selectedConditions.length === 0 && (
                                    <Text style={styles.emptyText}>No conditions selected.</Text>
                                )}
                            </View>
                        </View>
                    )}

                    {activeTab === 'medical' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Medical Profile</Text>

                            <View style={styles.card}>
                                <View style={styles.switchRow}>
                                    <View>
                                        <Text style={styles.label}>Insulin Dependent</Text>
                                        <Text style={styles.subText}>Do you take exogenous insulin?</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, data.medical.insulin ? styles.toggleBtnOn : styles.toggleBtnOff]}
                                        onPress={() => updateNested('medical', 'insulin', !data.medical.insulin)}
                                    >
                                        <View style={[styles.toggleKnob, data.medical.insulin ? styles.toggleKnobOn : styles.toggleKnobOff]} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 16 }]}>Current Medications</Text>
                            <View style={styles.card}>
                                <View style={styles.searchRow}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                                        placeholder="Search medication..."
                                        placeholderTextColor="#666"
                                        value={drugQuery}
                                        onChangeText={setDrugQuery}
                                        onSubmitEditing={searchDrugs}
                                    />
                                    <TouchableOpacity style={styles.searchBtn} onPress={searchDrugs} disabled={isSearchingDrug}>
                                        {isSearchingDrug ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="search" size={20} color="#fff" />}
                                    </TouchableOpacity>
                                </View>

                                {drugResults.length > 0 && (
                                    <View style={styles.searchResults}>
                                        {drugResults.map((drug, i) => (
                                            <TouchableOpacity key={i} style={styles.searchResultItem} onPress={() => addDrug(drug)}>
                                                <Text style={styles.searchResultText}>{drug.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.medicationList}>
                                    {data.medical.medications.map((med, i) => (
                                        <View key={i} style={styles.medicationItem}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.medName}>{med.name}</Text>
                                                {med.ingredients && (
                                                    <Text style={styles.medDesc}>{Array.isArray(med.ingredients) ? med.ingredients.join(', ') : med.ingredients}</Text>
                                                )}
                                            </View>
                                            <TouchableOpacity onPress={() => {
                                                const newMeds = data.medical.medications.filter((_, idx) => idx !== i);
                                                updateNested('medical', 'medications', newMeds);
                                            }}>
                                                <Feather name="trash-2" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {data.medical.medications.length === 0 && (
                                        <Text style={styles.emptyText}>No medications listed.</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === 'dietary' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Dislikes (comma separated)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={data.dietary.dislikes.join(', ')}
                                        onChangeText={v => updateNested('dietary', 'dislikes', v.split(',').map(s => s.trim()).filter(Boolean))}
                                        placeholder="e.g. Cilantro, Mushrooms"
                                        placeholderTextColor="#666"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Allergies (comma separated)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={data.dietary.allergies.join(', ')}
                                        onChangeText={v => updateNested('dietary', 'allergies', v.split(',').map(s => s.trim()).filter(Boolean))}
                                        placeholder="e.g. Peanuts, Shellfish"
                                        placeholderTextColor="#666"
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === 'settings' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>App Preferences</Text>

                            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                                <Feather name="log-out" size={18} color="#000" />
                                <Text style={styles.logoutBtnText}>Log Out</Text>
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
        paddingTop: 20,
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

