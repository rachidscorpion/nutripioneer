import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { Ionicons } from '@expo/vector-icons';

const COMMON_CUISINES = [
    'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian',
    'Thai', 'Mediterranean', 'French', 'American', 'Middle Eastern',
    'Greek', 'Spanish', 'Korean', 'Vietnamese'
];

export default function DietaryScreen() {
    const navigation = useNavigation();
    const { dietary, updateData, nextStep, prevStep } = useOnboardingStore();

    const [favInput, setFavInput] = useState('');
    const [dislikeInput, setDislikeInput] = useState('');

    // Tab State
    const [activeTab, setActiveTab] = useState<'favorites' | 'dislikes'>('favorites');

    const addItem = (type: 'favorites' | 'dislikes', item: string) => {
        if (!item.trim()) return;
        const currentList = dietary[type];
        if (!currentList.includes(item.trim())) {
            updateData('dietary', { [type]: [...currentList, item.trim()] });
        }
    };

    const removeItem = (type: 'favorites' | 'dislikes', item: string) => {
        const currentList = dietary[type];
        updateData('dietary', { [type]: currentList.filter(i => i !== item) });
    };

    const toggleCuisine = (type: 'favCuisines' | 'dislikeCuisines', cuisine: string) => {
        const currentList = dietary[type] || [];
        if (currentList.includes(cuisine)) {
            updateData('dietary', { [type]: currentList.filter(c => c !== cuisine) });
        } else {
            updateData('dietary', { [type]: [...currentList, cuisine] });
        }
    };

    const handleNext = () => {
        nextStep();
        navigation.navigate('OnboardingSynthesizing' as never);
    };

    const handleBack = () => {
        prevStep();
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>Taste Profile</Text>
                    <Text style={styles.subtitle}>Help us tailor options to what you love.</Text>
                </View>

                {/* Custom Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'favorites' && styles.tabActiveLove]}
                        onPress={() => setActiveTab('favorites')}
                    >
                        <Ionicons name="heart" size={20} color={activeTab === 'favorites' ? '#13ec5b' : '#9ca3af'} />
                        <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActiveLove]}>Love It</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'dislikes' && styles.tabActiveHate]}
                        onPress={() => setActiveTab('dislikes')}
                    >
                        <Ionicons name="thumbs-down" size={20} color={activeTab === 'dislikes' ? '#ef4444' : '#9ca3af'} />
                        <Text style={[styles.tabText, activeTab === 'dislikes' && styles.tabTextActiveHate]}>Leave It</Text>
                    </TouchableOpacity>
                </View>

                {/* Content based on Tab */}
                {activeTab === 'favorites' ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>What foods make you happy?</Text>

                        {/* Add Top Foods */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Pasta, Sushi"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={favInput}
                                    onChangeText={setFavInput}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: 'rgba(19,236,91,0.2)' }]}
                                onPress={() => { addItem('favorites', favInput); setFavInput(''); }}
                            >
                                <Ionicons name="add" size={24} color="#13ec5b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.chipWrapper}>
                            {dietary.favorites.map((item) => (
                                <View key={item} style={[styles.chip, styles.chipFav]}>
                                    <Text style={styles.chipTextFav}>{item}</Text>
                                    <TouchableOpacity onPress={() => removeItem('favorites', item)}>
                                        <Ionicons name="close" size={16} color="#13ec5b" style={styles.chipIcon} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        {/* Favorite Cuisines */}
                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Favorite Cuisines</Text>
                        <View style={styles.chipWrapper}>
                            {COMMON_CUISINES.map((cuisine) => {
                                const isSelected = dietary.favCuisines.includes(cuisine);
                                return (
                                    <TouchableOpacity
                                        key={cuisine}
                                        style={[styles.chipSelectable, isSelected && styles.chipSelectableFav]}
                                        onPress={() => toggleCuisine('favCuisines', cuisine)}
                                    >
                                        <Text style={[styles.chipTextSelectable, isSelected && styles.chipTextFav]}>
                                            {cuisine}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>What should we never show you?</Text>

                        {/* Add Disliked Foods */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Kale, Mushrooms"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={dislikeInput}
                                    onChangeText={setDislikeInput}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: 'rgba(239,68,68,0.2)' }]}
                                onPress={() => { addItem('dislikes', dislikeInput); setDislikeInput(''); }}
                            >
                                <Ionicons name="add" size={24} color="#ef4444" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.chipWrapper}>
                            {dietary.dislikes.map((item) => (
                                <View key={item} style={[styles.chip, styles.chipDislike]}>
                                    <Text style={styles.chipTextDislike}>{item}</Text>
                                    <TouchableOpacity onPress={() => removeItem('dislikes', item)}>
                                        <Ionicons name="close" size={16} color="#ef4444" style={styles.chipIcon} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        {/* Disliked Cuisines */}
                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Disliked Cuisines</Text>
                        <View style={styles.chipWrapper}>
                            {COMMON_CUISINES.map((cuisine) => {
                                const isSelected = dietary.dislikeCuisines.includes(cuisine);
                                return (
                                    <TouchableOpacity
                                        key={cuisine}
                                        style={[styles.chipSelectable, isSelected && styles.chipSelectableDislike]}
                                        onPress={() => toggleCuisine('dislikeCuisines', cuisine)}
                                    >
                                        <Text style={[styles.chipTextSelectable, isSelected && styles.chipTextDislike]}>
                                            {cuisine}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextText}>Synthesize</Text>
                        <Ionicons name="arrow-forward" size={20} color="#000" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
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
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActiveLove: {
        borderBottomColor: '#13ec5b',
    },
    tabActiveHate: {
        borderBottomColor: '#ef4444',
    },
    tabText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    tabTextActiveLove: {
        color: '#13ec5b',
    },
    tabTextActiveHate: {
        color: '#ef4444',
    },
    section: {
        flex: 1,
    },
    sectionTitle: {
        color: '#9ca3af',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    inputContainer: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        paddingHorizontal: 16,
        marginRight: 12,
    },
    input: {
        color: '#fff',
        fontSize: 16,
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipFav: {
        backgroundColor: 'rgba(19,236,91,0.1)',
        borderColor: 'rgba(19,236,91,0.3)',
    },
    chipDislike: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderColor: 'rgba(239,68,68,0.3)',
    },
    chipTextFav: {
        color: '#13ec5b',
        fontWeight: '600',
        fontSize: 14,
    },
    chipTextDislike: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: 14,
    },
    chipIcon: {
        marginLeft: 8,
    },
    chipSelectable: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    chipSelectableFav: {
        backgroundColor: 'rgba(19,236,91,0.1)',
        borderColor: 'rgba(19,236,91,0.5)',
    },
    chipSelectableDislike: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderColor: 'rgba(239,68,68,0.5)',
    },
    chipTextSelectable: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
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
