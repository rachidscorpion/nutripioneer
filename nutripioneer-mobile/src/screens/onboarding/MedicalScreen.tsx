import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api-client';

export default function MedicalScreen() {
    const navigation = useNavigation();
    const { medical, updateData, nextStep, prevStep } = useOnboardingStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchInitial = async () => {
            // No initial fetch logic since local state handles what we persist
        };
        fetchInitial();
    }, []);

    const toggleInsulin = () => {
        updateData('medical', { insulin: !medical.insulin });
    };

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await api.drugs.search(text);
            if (res.data?.results) {
                setSearchResults(res.data.results);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Drug search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const addMedication = async (drugName: string, rxcui: string) => {
        setSearchQuery('');
        setSearchResults([]);
        if (!rxcui) return;

        setLoadingDetails(true);
        try {
            const res = await api.drugs.details(drugName, rxcui);
            if (res.data) {
                const newMed = res.data;
                const exists = medical.medications.some(m => m.rxnorm_rxcui === newMed.rxnorm_rxcui);
                if (!exists) {
                    updateData('medical', {
                        medications: [...medical.medications, newMed]
                    });
                } else {
                    Alert.alert('Info', 'Medication is already added.');
                }
            }
        } catch (error) {
            console.error('Failed to fetch drug details:', error);
            Alert.alert('Error', 'Could not retrieve details for this medication.');
        } finally {
            setLoadingDetails(false);
        }
    };

    const removeMedication = (rxcui?: string) => {
        if (!rxcui) return;
        const filtered = medical.medications.filter(m => m.rxnorm_rxcui !== rxcui);
        updateData('medical', { medications: filtered });
    };

    const handleNext = () => {
        nextStep();
        navigation.navigate('OnboardingDietary' as never);
    };

    const handleBack = () => {
        prevStep();
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Health Profile</Text>
                    <Text style={styles.subtitle}>Help us understand your current treatments.</Text>
                </View>

                {/* Insulin Toggle */}
                <TouchableOpacity style={styles.toggleCard} onPress={toggleInsulin} activeOpacity={0.8}>
                    <View style={styles.toggleCardContent}>
                        <Ionicons name="medical-outline" size={24} color={medical.insulin ? '#13ec5b' : '#9ca3af'} />
                        <Text style={[styles.toggleText, medical.insulin && styles.toggleTextActive]}>
                            I use Insulin
                        </Text>
                    </View>
                    <View style={[styles.checkbox, medical.insulin && styles.checkboxActive]}>
                        {medical.insulin && <Ionicons name="checkmark" size={16} color="#000" />}
                    </View>
                </TouchableOpacity>

                {/* Medications Search */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Search Medications</Text>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#13ec5b" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="e.g. Metformin or Lisinopril"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {(isSearching || loadingDetails) && <ActivityIndicator size="small" color="#13ec5b" />}
                    </View>

                    {/* Drug Search Results */}
                    {searchQuery.length > 0 && searchResults.length > 0 && (
                        <View style={styles.dropdown}>
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item, idx) => item.rxcui || idx.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.dropdownItem}
                                        onPress={() => addMedication(item.name, item.rxcui)}
                                    >
                                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                                keyboardShouldPersistTaps="handled"
                                style={{ maxHeight: 200 }}
                            />
                        </View>
                    )}
                </View>

                {/* Selected Medications */}
                <View style={styles.medsContainer}>
                    {medical.medications.map((med) => (
                        <View key={med.rxnorm_rxcui} style={styles.medChip}>
                            <Text style={styles.medChipText} numberOfLines={1}>{med.name}</Text>
                            <TouchableOpacity onPress={() => removeMedication(med.rxnorm_rxcui)} style={styles.medRemove}>
                                <Ionicons name="close" size={16} color="#13ec5b" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <Text style={styles.disclaimerText}>
                    "NutriPioneer uses publicly available data to check for food-drug interactions. Always consult your doctor."
                </Text>

                {/* Footer */}
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
        backgroundColor: '#111827',
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
    toggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
    },
    toggleCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleText: {
        color: '#9ca3af',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    toggleTextActive: {
        color: '#fff',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#13ec5b',
        borderColor: '#13ec5b',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    section: {
        zIndex: 10,
    },
    sectionLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
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
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    dropdown: {
        position: 'absolute',
        top: 90,
        left: 0,
        right: 0,
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        maxHeight: 200,
        zIndex: 50,
        elevation: 10,
    },
    dropdownItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    dropdownItemText: {
        color: '#fff',
        fontSize: 16,
    },
    medsContainer: {
        flex: 1,
        zIndex: 1,
    },
    medChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.3)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
        justifyContent: 'space-between',
    },
    medChipText: {
        color: '#13ec5b',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 12,
    },
    medRemove: {
        padding: 4,
    },
    disclaimerText: {
        color: '#6b7280',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
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
