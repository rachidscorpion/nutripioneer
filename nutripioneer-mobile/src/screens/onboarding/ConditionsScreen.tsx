import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api-client';

const COMMON_CONDITIONS = [
    { title: 'Type 2 Diabetes', icdCode: '5A11', searchTerm: 'Type 2 Diabetes Mellitus', icon: 'water-outline' },
    { title: 'Hypertension', icdCode: 'BA00', searchTerm: 'Hypertension', icon: 'heart-outline' },
    { title: 'PCOS', icdCode: 'KA21.0', searchTerm: 'Polycystic ovary syndrome', icon: 'female-outline' },
    { title: 'Celiac Disease', icdCode: 'DA96', searchTerm: 'Coeliac disease', icon: 'shield-checkmark-outline' },
];

export default function ConditionsScreen() {
    const navigation = useNavigation();
    const { conditions, updateData, nextStep, prevStep } = useOnboardingStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // We store full objects for display, but persist slugs in the store
    const [selectedObjects, setSelectedObjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchInitial = async () => {
            if (conditions.length === 0) return;
            try {
                const res = await api.conditions.list();
                if (res.data?.success && res.data?.data) {
                    const matches = res.data.data.filter((c: any) => conditions.includes(c.slug));
                    setSelectedObjects(matches);
                }
            } catch (error) {
                console.error('Failed to load selected conditions', error);
            }
        };
        fetchInitial();
    }, []);

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await api.conditions.search(text);
            if (res.data?.success) {
                setSearchResults(res.data.data || []);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectCondition = async (icdItem: any) => {
        try {
            setIsSearching(true);
            // Onboard the condition via backend API
            const res = await api.conditions.onboard({
                icdCode: icdItem.code || icdItem.icdCode,
                title: icdItem.title,
                uri: icdItem.uri,
                description: icdItem.description || icdItem.title
            });

            if (res.data?.success) {
                const conditionId = res.data.data.id;
                const fullRes = await api.conditions.getById(conditionId);

                if (fullRes.data?.success) {
                    const conditionObj = fullRes.data.data;
                    if (!conditions.includes(conditionObj.slug)) {
                        updateData('conditions', [...conditions, conditionObj.slug]);
                        setSelectedObjects([...selectedObjects, conditionObj]);
                    } else {
                        Alert.alert('Info', 'Condition already added');
                    }
                }
            }
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Onboarding condition error:', error);
            Alert.alert('Error', 'Failed to add condition. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleRemoveCondition = (slug: string) => {
        updateData('conditions', conditions.filter(c => c !== slug));
        setSelectedObjects(selectedObjects.filter(c => c.slug !== slug));
    };

    const handleNext = () => {
        nextStep();
        navigation.navigate('OnboardingBiometrics' as never);
    };

    const handleBack = () => {
        prevStep();
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>What brings you here?</Text>
                    <Text style={styles.subtitle}>Select or search for medical conditions.</Text>
                </View>

                {/* Selected Conditions */}
                {selectedObjects.length > 0 && (
                    <View style={styles.selectedContainer}>
                        {selectedObjects.map((c) => (
                            <View key={c.id} style={[styles.selectedChip, { borderColor: c.color || '#13ec5b' }]}>
                                <Text style={[styles.selectedChipText, { color: c.color || '#fff' }]}>{c.label}</Text>
                                <TouchableOpacity onPress={() => handleRemoveCondition(c.slug)}>
                                    <Ionicons name="close-circle" size={20} color={c.color || '#13ec5b'} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#13ec5b" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search conditions (e.g. Anemia)"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {isSearching && <ActivityIndicator size="small" color="#13ec5b" />}
                </View>

                {/* Search Results or Common Suggestions */}
                <View style={styles.listContainer}>
                    {searchQuery.length > 0 ? (
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item, index) => item.uri || index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectCondition(item)}>
                                    <Text style={styles.resultTitle}>{item.title}</Text>
                                    <Text style={styles.resultDesc} numberOfLines={1}>{item.description || item.title}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                !isSearching && searchQuery.length >= 3 ? (
                                    <Text style={styles.emptyText}>No conditions found.</Text>
                                ) : null
                            }
                        />
                    ) : (
                        <View>
                            <Text style={styles.sectionTitle}>Common Conditions</Text>
                            <View style={styles.commonGrid}>
                                {COMMON_CONDITIONS.map((condition, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.commonCard}
                                        onPress={() => handleSelectCondition({
                                            title: condition.searchTerm,
                                            icdCode: condition.icdCode,
                                            uri: `http://id.who.int/icd/entity/${condition.icdCode}`
                                        })}
                                    >
                                        <Ionicons name={condition.icon as any} size={28} color="#13ec5b" style={styles.commonIcon} />
                                        <Text style={styles.commonTitle}>{condition.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Navigation Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={20} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // Dark charcoal/navy
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
    },
    selectedContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 10,
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    selectedChipText: {
        fontWeight: '600',
        marginRight: 8,
        fontSize: 14,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.4)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 24,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    listContainer: {
        flex: 1,
    },
    resultItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    resultTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    resultDesc: {
        color: '#9ca3af',
        fontSize: 14,
    },
    emptyText: {
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 20,
    },
    sectionTitle: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    commonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    commonCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    commonIcon: {
        marginBottom: 12,
    },
    commonTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    backText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#13ec5b',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 28,
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    nextText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8,
    },
});
