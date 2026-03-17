import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Image, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../lib/api-client';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width } = Dimensions.get('window');

interface FoodCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    planId?: string;
}

type SearchMode = 'Generic' | 'Brand';

const BarcodeScanner = ({ onResult, onCancel }: { onResult: (result: string) => void, onCancel: () => void }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    if (!permission) return (
        <View style={styles.scannerCenter}>
            <ActivityIndicator color="#13ec5b" />
        </View>
    );
    if (!permission.granted) {
        return (
            <View style={styles.scannerCenter}>
                <Text style={{ color: 'white', textAlign: 'center', marginBottom: 15 }}>We need your permission to use the barcode scanner</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 15 }} onPress={onCancel}>
                    <Text style={{ color: '#64748b' }}>Cancel Scan</Text>
                </TouchableOpacity>
            </View>
        );
    }
    return (
        <View style={styles.scannerContainer}>
            <View style={styles.cameraWrapper}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : ({ data }) => {
                        setScanned(true);
                        onResult(data);
                    }}
                />
                <View style={styles.scannerOverlay}>
                    <View style={styles.scannerRect} />
                </View>
            </View>
            <TouchableOpacity style={styles.cancelScanBtn} onPress={onCancel}>
                <Text style={styles.cancelScanText}>Cancel Scan</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function FoodCheckModal({ isOpen, onClose, planId }: FoodCheckModalProps) {
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showRecipe, setShowRecipe] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [activeTab, setActiveTab] = useState<SearchMode>('Generic');
    const [suggestions, setSuggestions] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResult(null);
            setIsScanning(false);
            setSuggestions([]);
            setShowRecipe(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSearch = async (forcedQuery?: string) => {
        const searchQuery = forcedQuery || query;
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setShowRecipe(false);
        setResult(null);
        setSuggestions([]);

        try {
            const res = await api.food.analyze(searchQuery, activeTab);
            const responseData = res.data || res;
            const finalResult = responseData.data || responseData;
            setResult(finalResult);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Search failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTextChange = (text: string) => {
        setQuery(text);
        if (text.length > 2) {
            api.food.search(text, activeTab).then(res => {
                setSuggestions(res.data?.data || []);
            }).catch(() => setSuggestions([]));
        } else {
            setSuggestions([]);
        }
    };

    const handleAddToPlan = async (type: 'breakfast' | 'lunch' | 'dinner') => {
        if (!planId || !result) return;
        setIsAdding(true);
        try {
            const mealData = {
                planId,
                type,
                name: result.name || query,
                image: result.image,
                instructions: result.instructions || result.mealDbInfo?.instructions,
                ingredients: result.ingredients,
                nutrition: result.nutrition,
                externalId: result.originalId,
                source: result.source,
            };
            await api.plans.addExternalMeal(mealData);
            Alert.alert('Success', `Allocated for ${type}`);
            onClose();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to add meal");
        } finally {
            setIsAdding(false);
        }
    };

    const formatInstructions = (text: string) => {
        if (!text) return [];
        let cleanText = text.replace(/Step\s+\d+[:.]?/gi, '');
        const rawLines = cleanText.split(/\r?\n/);
        const steps: string[] = [];
        rawLines.forEach(line => {
            let trimmed = line.trim();
            if (!trimmed) return;
            trimmed = trimmed.replace(/^\d+[\).]\s*/, '');
            if (!trimmed) return;
            if (/^\d+$/.test(trimmed)) return;
            steps.push(trimmed);
        });
        if (steps.length <= 1 && text.length > 200) {
            return text.split('. ').filter(s => s.trim().length > 10).map(s => s.trim() + '.');
        }
        return steps;
    };

    const getStatusInfo = () => {
        if (!result) return { color: '#64748b', icon: 'information-circle' as any, bg: 'transparent', border: 'transparent' };

        let statusColor = 'Safe';
        if (result.bioavailability) {
            statusColor = result.bioavailability.color === 'Red' ? 'Avoid' : result.bioavailability.color === 'Yellow' ? 'Caution' : 'Safe';
        } else {
            statusColor = result.status;
        }

        if (statusColor === 'Avoid') return { color: '#ef4444', icon: 'warning', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
        if (statusColor === 'Caution') return { color: '#eab308', icon: 'alert-circle', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' };
        return { color: '#10b981', icon: 'checkmark-circle', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' };
    };

    const statusInfo = getStatusInfo();

    return (
        <Modal visible={isOpen} transparent animationType="slide">
            <View style={styles.backdrop}>
                <View style={[styles.modalContent, { marginTop: insets.top + 20, marginBottom: insets.bottom + 20 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>On-Demand Check</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity style={[styles.tabBtn, activeTab === 'Generic' && styles.tabBtnActive]} onPress={() => { setActiveTab('Generic'); setSuggestions([]); }}>
                            <Ionicons name="basket-outline" size={16} color={activeTab === 'Generic' ? '#000' : '#64748b'} />
                            <Text style={[styles.tabText, activeTab === 'Generic' && styles.tabTextActive]}>General</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tabBtn, activeTab === 'Brand' && styles.tabBtnActive]} onPress={() => { setActiveTab('Brand'); setSuggestions([]); }}>
                            <Ionicons name="restaurant-outline" size={16} color={activeTab === 'Brand' ? '#000' : '#64748b'} />
                            <Text style={[styles.tabText, activeTab === 'Brand' && styles.tabTextActive]}>Restaurants</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchBarContainer}>
                        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={activeTab === 'Generic' ? "e.g. Apple, Chicken Breast" : "e.g. Chick-fil-A, Chipotle"}
                            placeholderTextColor="#64748b"
                            value={query}
                            onChangeText={handleTextChange}
                            onSubmitEditing={() => handleSearch()}
                            returnKeyType="search"
                        />
                        <TouchableOpacity onPress={() => {
                            setIsScanning(!isScanning);
                            setResult(null);
                            setSuggestions([]);
                        }} style={styles.scanBtn}>
                            <Ionicons name="barcode-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleSearch()} style={styles.checkBtn} disabled={isLoading || !query.trim()}>
                            <Text style={styles.checkBtnText}>Check</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Suggestions Area */}
                    {suggestions.length > 0 && !result && !isLoading && !isScanning && (
                        <View style={styles.suggestionsContainer}>
                            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                {suggestions.map((item, idx) => (
                                    <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => {
                                        setQuery(item.name);
                                        handleSearch(item.name);
                                    }}>
                                        <View style={styles.suggestionImagePlaceholder}>
                                            {item.image ? (
                                                <Image source={{ uri: item.image }} style={styles.suggestionImage} />
                                            ) : (
                                                <Ionicons name={activeTab === 'Brand' ? "restaurant" : "basket"} size={16} color="#64748b" />
                                            )}
                                        </View>
                                        <View style={styles.suggestionTextWrapper}>
                                            <Text style={styles.suggestionTitle}>{item.name}</Text>
                                            {item.brand && <Text style={styles.suggestionBrand}>{item.brand}</Text>}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Main Content Area */}
                    <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {isScanning && (
                            <BarcodeScanner
                                onResult={(data) => {
                                    setIsScanning(false);
                                    setIsLoading(true);
                                    api.food.analyzeBarcode(data).then(res => {
                                        const responseData = res.data || res;
                                        setResult(responseData.data || responseData);
                                    }).catch(e => {
                                        console.error(e);
                                        Alert.alert('Error', 'Failed to analyze barcode');
                                    }).finally(() => {
                                        setIsLoading(false);
                                    });
                                }}
                                onCancel={() => setIsScanning(false)}
                            />
                        )}

                        {isLoading && (
                            <View style={styles.centerBox}>
                                <ActivityIndicator size="large" color="#13ec5b" />
                                <Text style={styles.analyzeText}>Analyzing metabolic impact...</Text>
                            </View>
                        )}

                        {(!result && !isLoading && !isScanning && suggestions.length === 0) && (
                            <View style={styles.centerBox}>
                                <Text style={styles.placeholderText}>Type a food or scan a barcode to check.</Text>
                            </View>
                        )}

                        {result && !isLoading && !isScanning && (
                            <View style={styles.resultContainer}>
                                <View style={styles.imageContainer}>
                                    {result.image ? (
                                        <Image source={{ uri: result.image }} style={styles.resultImage} />
                                    ) : (
                                        <View style={styles.largePlaceholder}>
                                            <Ionicons name={activeTab === 'Brand' ? "restaurant-outline" : "basket-outline"} size={48} color="#64748b" />
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.resultName}>{result.name}</Text>

                                <View style={[styles.statusCard, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
                                    <Ionicons name={statusInfo.icon} size={48} color={statusInfo.color} style={{ marginBottom: 12 }} />
                                    <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                                        {result.bioavailability ? `Bioavailability: ${result.bioavailability.score}/100` : result.status}
                                    </Text>
                                    <Text style={[styles.statusReason, { color: statusInfo.color }]}>
                                        {result.bioavailability ? result.bioavailability.reasoning : result.reason}
                                    </Text>
                                </View>

                                {result.modification && (
                                    <View style={styles.modsCard}>
                                        <Text style={styles.modTitle}>How to make it safer</Text>
                                        <Text style={styles.modText}>{result.modification}</Text>
                                    </View>
                                )}

                                <View style={styles.nutritionGrid}>
                                    <View style={styles.nutriBox}>
                                        <Text style={styles.nutriLabel}>Cal</Text>
                                        <Text style={styles.nutriValue}>{result.nutrition.calories}</Text>
                                    </View>
                                    <View style={styles.nutriBox}>
                                        <Text style={styles.nutriLabel}>Carb</Text>
                                        <Text style={styles.nutriValue}>{result.nutrition.carbs}g</Text>
                                    </View>
                                    <View style={styles.nutriBox}>
                                        <Text style={styles.nutriLabel}>Prot</Text>
                                        <Text style={styles.nutriValue}>{result.nutrition.protein}g</Text>
                                    </View>
                                    <View style={styles.nutriBox}>
                                        <Text style={styles.nutriLabel}>Fat</Text>
                                        <Text style={styles.nutriValue}>{result.nutrition.fat}g</Text>
                                    </View>
                                    <View style={styles.nutriBox}>
                                        <Text style={styles.nutriLabel}>Total Sug</Text>
                                        <Text style={styles.nutriValue}>{(result.nutrition.addedSugar || 0) + (result.nutrition.sugar || 0)}g</Text>
                                    </View>
                                </View>

                                {result.mealDbInfo?.instructions && (
                                    <>
                                        <TouchableOpacity style={styles.recipeBtn} onPress={() => setShowRecipe(!showRecipe)}>
                                            <Ionicons name="restaurant-outline" size={18} color="#fff" />
                                            <Text style={styles.recipeBtnText}>{showRecipe ? 'Hide Instructions' : 'View Instructions'}</Text>
                                            <Ionicons name={showRecipe ? "chevron-up" : "chevron-down"} size={16} color="#fff" />
                                        </TouchableOpacity>

                                        {showRecipe && (
                                            <View style={styles.instructionsWrapper}>
                                                {formatInstructions(result.mealDbInfo.instructions).map((step: string, idx: number) => (
                                                    <View key={idx} style={styles.stepRow}>
                                                        <View style={styles.stepBadge}>
                                                            <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                                                        </View>
                                                        <Text style={styles.stepText}>{step}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                )}

                                {planId && (
                                    <View style={styles.planSection}>
                                        <Text style={styles.planTitle}>EAT THIS FOR...</Text>
                                        <View style={styles.planBtnRow}>
                                            {(['breakfast', 'lunch', 'dinner'] as const).map(type => (
                                                <TouchableOpacity key={type}
                                                    style={[styles.planActionBtn, isAdding ? { opacity: 0.5 } : {}]}
                                                    disabled={isAdding}
                                                    onPress={() => handleAddToPlan(type)}
                                                >
                                                    {isAdding ? (
                                                        <ActivityIndicator size="small" color="#000" />
                                                    ) : (
                                                        <Ionicons name="add" size={16} color="#000" />
                                                    )}
                                                    <Text style={styles.planActionText}>{type}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                <View style={{ height: 40 }} />
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
    },
    modalContent: {
        flex: 1,
        marginHorizontal: 16,
        backgroundColor: '#1c1c1e',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    closeBtn: {
        padding: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#2c2c2e',
    },
    tabBtnActive: {
        backgroundColor: '#13ec5b',
    },
    tabText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    tabTextActive: {
        color: '#000',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        position: 'relative',
        zIndex: 10,
    },
    searchIcon: {
        position: 'absolute',
        left: 32,
        top: 10,
        zIndex: 2,
    },
    searchInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#2c2c2e',
        borderRadius: 12,
        paddingLeft: 38,
        paddingRight: 12,
        color: '#fff',
        fontSize: 14,
    },
    scanBtn: {
        padding: 8,
        marginLeft: 8,
        backgroundColor: '#333',
        borderRadius: 12,
    },
    checkBtn: {
        backgroundColor: '#13ec5b',
        paddingHorizontal: 16,
        height: 40,
        justifyContent: 'center',
        borderRadius: 12,
        marginLeft: 8,
    },
    checkBtnText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 14,
    },
    mainContent: {
        flex: 1,
    },
    centerBox: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    analyzeText: {
        color: '#64748b',
        marginTop: 12,
        fontWeight: '500',
    },
    placeholderText: {
        color: '#64748b',
        fontSize: 14,
        textAlign: 'center',
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 145, // roughly below tabs and search
        left: 20,
        right: 20,
        backgroundColor: '#2c2c2e',
        borderRadius: 12,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#444',
        zIndex: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    suggestionImagePlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#1c1c1e',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    suggestionImage: {
        width: 32,
        height: 32,
        borderRadius: 6,
    },
    suggestionTextWrapper: {
        flex: 1,
    },
    suggestionTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    suggestionBrand: {
        color: '#9ca3af',
        fontSize: 12,
        marginTop: 2,
    },
    resultContainer: {
        padding: 20,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    resultImage: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: '#2c2c2e',
    },
    largePlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#2c2c2e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    statusCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 20,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    statusReason: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    modsCard: {
        backgroundColor: '#2c2c2e',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    modTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    modText: {
        color: '#d1d5db',
        fontSize: 14,
        lineHeight: 20,
    },
    nutritionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        backgroundColor: '#2c2c2e',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    nutriBox: {
        alignItems: 'center',
        width: '18%',
    },
    nutriLabel: {
        color: '#9ca3af',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    nutriValue: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    recipeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    recipeBtnText: {
        color: '#fff',
        fontWeight: '600',
        marginHorizontal: 8,
    },
    instructionsWrapper: {
        backgroundColor: '#2c2c2e',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#13ec5b',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    stepBadgeText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepText: {
        flex: 1,
        color: '#d1d5db',
        fontSize: 14,
        lineHeight: 20,
    },
    planSection: {
        borderTopWidth: 1,
        borderColor: '#333',
        paddingTop: 20,
    },
    planTitle: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    planBtnRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    planActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#13ec5b',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        flex: 1,
        marginHorizontal: 4,
        justifyContent: 'center',
    },
    planActionText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 4,
        textTransform: 'capitalize',
    },
    scannerCenter: {
        padding: 40,
        alignItems: 'center',
    },
    permissionBtn: {
        backgroundColor: '#13ec5b',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    permissionBtnText: {
        color: '#000',
        fontWeight: 'bold',
    },
    scannerContainer: {
        padding: 20,
        alignItems: 'center',
    },
    cameraWrapper: {
        width: '100%',
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerRect: {
        width: 200,
        height: 200,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        borderRadius: 12,
    },
    cancelScanBtn: {
        marginTop: 16,
        padding: 8,
    },
    cancelScanText: {
        color: '#64748b',
        textDecorationLine: 'underline',
        fontWeight: '500',
    }
});
