import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api-client';
import { useTheme } from '../../context/ThemeContext';

export interface MenuItem {
    name: string;
    description?: string;
    status: 'SAFE' | 'CAUTION' | 'AVOID';
    reasoning: string;
    modification?: string;
}

export interface MenuAnalysisResult {
    items: MenuItem[];
    summary: string;
}

// --- Local Components ---

const MenuScannerUI = ({
    onScan,
    isScanning,
    theme,
}: {
    onScan: (file: { uri: string; type: string; name: string }) => void;
    isScanning: boolean;
    theme: any;
}) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setPreview(result.assets[0].uri);
            setSelectedAsset(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setPreview(result.assets[0].uri);
            setSelectedAsset(result.assets[0]);
        }
    };

    const handleScan = () => {
        if (selectedAsset) {
            // Provide a default type and name if missing
            onScan({
                uri: selectedAsset.uri,
                type: selectedAsset.mimeType || 'image/jpeg',
                name: selectedAsset.fileName || 'menu-scan.jpg',
            });
        }
    };

    if (preview) {
        return (
            <View style={styles.scannerContainer}>
                <Image source={{ uri: preview }} style={styles.previewImage} />
                <TouchableOpacity
                    style={styles.closePreviewButton}
                    onPress={() => {
                        setPreview(null);
                        setSelectedAsset(null);
                    }}
                    disabled={isScanning}
                >
                    <Ionicons name="close-circle" size={32} color="#fff" />
                </TouchableOpacity>

                <View style={styles.scannerActions}>
                    <TouchableOpacity style={[styles.scanButton, { backgroundColor: theme.primary }]} onPress={handleScan} disabled={isScanning}>
                        {isScanning ? (
                            <ActivityIndicator color="#000" style={{ marginRight: 8 }} />
                        ) : (
                            <Ionicons name="scan" size={24} color="#000" style={{ marginRight: 8 }} />
                        )}
                        <Text style={[styles.scanButtonText, { color: '#000' }]}>{isScanning ? 'Analyzing...' : 'Scan Menu'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.scannerContainer}>
            <View style={styles.scannerHeader}>
                <Ionicons name="camera" size={48} color={theme.primary} />
                <Text style={[styles.scannerTitle, { color: theme.text }]}>Restaurant Menu Rescue</Text>
                <Text style={[styles.scannerSubtitle, { color: theme.textMuted }]}>
                    Snap a photo of any menu to instantly find dishes that match your dietary needs.
                </Text>
            </View>

            <View style={styles.pickerActions}>
                <TouchableOpacity style={[styles.pickerButtonPrimary, { backgroundColor: theme.primary }]} onPress={takePhoto}>
                    <Ionicons name="camera-outline" size={24} color="#000" />
                    <Text style={[styles.pickerButtonTextPrimary, { color: '#000' }]}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pickerButtonSecondary, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={pickImage}>
                    <Ionicons name="image-outline" size={24} color={theme.text} />
                    <Text style={[styles.pickerButtonTextSecondary, { color: theme.text }]}>Choose from Library</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const ResultItemCard = ({ item, theme }: { item: MenuItem; theme: any }) => {
    const [expanded, setExpanded] = useState(false);

    const isSafe = item.status === 'SAFE';
    const isCaution = item.status === 'CAUTION';
    const isAvoid = item.status === 'AVOID';

    const getIcon = () => {
        if (isSafe) return <Ionicons name="checkmark-circle" size={24} color="#10b981" />;
        if (isCaution) return <Ionicons name="warning" size={24} color="#f59e0b" />;
        return <Ionicons name="close-circle" size={24} color="#ef4444" />;
    };

    return (
        <TouchableOpacity style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
            <View style={styles.itemHeader}>
                <View style={styles.itemHeaderLeft}>
                    {getIcon()}
                    <View style={styles.itemHeaderText}>
                        <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                        <View
                            style={[
                                styles.statusBadge,
                                isSafe && styles.badgeSafe,
                                isCaution && styles.badgeCaution,
                                isAvoid && styles.badgeAvoid,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusBadgeText,
                                    isSafe && styles.badgeTextSafe,
                                    isCaution && styles.badgeTextCaution,
                                    isAvoid && styles.badgeTextAvoid,
                                ]}
                            >
                                {item.status}
                            </Text>
                        </View>
                    </View>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textMuted} />
            </View>

            {item.description && <Text style={[styles.itemDescription, { color: theme.textMuted }]}>{item.description}</Text>}

            {expanded && (
                <View style={[styles.itemDetails, { borderTopColor: theme.border }]}>
                    <View style={styles.detailSection}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Nutrition Analysis</Text>
                        <Text style={[styles.detailText, { color: theme.text }]}>{item.reasoning}</Text>
                    </View>
                    {item.modification && (
                        <View style={[styles.modificationBox, { backgroundColor: theme.primary + '1A' }]}>
                            <Text style={[styles.modificationLabel, { color: theme.primary }]}>Recommended Modification</Text>
                            <Text style={[styles.modificationText, { color: theme.text }]}>{item.modification}</Text>
                        </View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const MenuResultsUI = ({ result, onReset, theme }: { result: MenuAnalysisResult; onReset: () => void; theme: any }) => {
    const safeItems = result.items.filter((i) => i.status === 'SAFE');
    const cautionItems = result.items.filter((i) => i.status === 'CAUTION');
    const avoidItems = result.items.filter((i) => i.status === 'AVOID');

    const renderSection = (title: string, items: MenuItem[], icon: React.ReactNode, bgColor: string, textColor: string) => {
        if (items.length === 0) return null;
        return (
            <View style={styles.resultsSection}>
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: bgColor }]}>{icon}</View>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
                </View>
                {items.map((item, index) => (
                    <ResultItemCard key={index} item={item} theme={theme} />
                ))}
            </View>
        );
    };

    return (
        <ScrollView style={styles.resultsContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.resultsHero}>
                <View style={[styles.heroIconBg, { backgroundColor: theme.primary + '1A' }]}>
                    <Ionicons name="checkmark" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.resultsHeroTitle, { color: theme.text }]}>Menu Analyzed</Text>
                <Text style={[styles.resultsSummary, { color: theme.textMuted }]}>{result.summary}</Text>
            </View>

            {renderSection(
                'Safe to Order',
                safeItems,
                <Ionicons name="checkmark" size={18} color="#16a34a" />,
                '#dcfce7',
                '#16a34a'
            )}
            {renderSection(
                'Order with Modifications',
                cautionItems,
                <Ionicons name="warning" size={18} color="#d97706" />,
                '#fef3c7',
                '#d97706'
            )}
            {renderSection(
                'Should Avoid',
                avoidItems,
                <Ionicons name="close" size={18} color="#dc2626" />,
                '#fee2e2',
                '#dc2626'
            )}

            <TouchableOpacity style={[styles.resetButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onReset}>
                <Ionicons name="refresh" size={20} color={theme.text} style={{ marginRight: 8 }} />
                <Text style={[styles.resetButtonText, { color: theme.text }]}>Scan Another Menu</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

// --- Main Screen ---

export default function RestaurantRescueScreen() {
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<MenuAnalysisResult | null>(null);
    const { theme } = useTheme();

    const handleScan = async (file: { uri: string; type: string; name: string }) => {
        setIsScanning(true);
        try {
            const response = await api.menu.scan(file);
            if (response.data && response.data.success && response.data.data) {
                setResult(response.data.data);
            } else {
                throw new Error('Failed to analyze menu');
            }
        } catch (error: any) {
            console.error('Error scanning menu:', error);
            Alert.alert('Scan Failed', error.message || 'Failed to scan menu. Please try again.');
        } finally {
            setIsScanning(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {!result ? (
                <MenuScannerUI onScan={handleScan} isScanning={isScanning} theme={theme} />
            ) : (
                <MenuResultsUI result={result} onReset={() => setResult(null)} theme={theme} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // --- MenuScannerUI ---
    scannerContainer: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    scannerHeader: {
        alignItems: 'center',
        marginBottom: 48,
    },
    scannerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    scannerSubtitle: {
        fontSize: 16,
        color: '#a1a1aa',
        textAlign: 'center',
        lineHeight: 24,
    },
    pickerActions: {
        gap: 16,
    },
    pickerButtonPrimary: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 24,
    },
    pickerButtonTextPrimary: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    pickerButtonSecondary: {
        backgroundColor: '#27272a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#3f3f46',
    },
    pickerButtonTextSecondary: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        resizeMode: 'cover',
    },
    closePreviewButton: {
        position: 'absolute',
        top: 40,
        right: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    scannerActions: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
    },
    scanButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 24,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // --- MenuResultsUI ---
    resultsContainer: {
        flex: 1,
        padding: 16,
    },
    resultsHero: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 16,
    },
    heroIconBg: {
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 32,
        marginBottom: 12,
    },
    resultsHeroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    resultsSummary: {
        fontSize: 16,
        color: '#a1a1aa',
        textAlign: 'center',
        lineHeight: 24,
    },
    resultsSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    itemCard: {
        backgroundColor: '#18181b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#27272a',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemHeaderLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    itemHeaderText: {
        marginLeft: 12,
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeSafe: { backgroundColor: '#064e3b' },
    badgeCaution: { backgroundColor: '#78350f' },
    badgeAvoid: { backgroundColor: '#7f1d1d' },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    badgeTextSafe: { color: '#34d399' },
    badgeTextCaution: { color: '#fbbf24' },
    badgeTextAvoid: { color: '#f87171' },
    itemDescription: {
        marginTop: 8,
        marginLeft: 36,
        fontSize: 14,
        color: '#a1a1aa',
    },
    itemDetails: {
        marginTop: 16,
        marginLeft: 36,
        borderTopWidth: 1,
        borderTopColor: '#27272a',
        paddingTop: 16,
    },
    detailSection: {
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#a1a1aa',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#fff',
        lineHeight: 20,
    },
    modificationBox: {
        backgroundColor: '#172554',
        padding: 12,
        borderRadius: 8,
    },
    modificationLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#60a5fa',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    modificationText: {
        fontSize: 14,
        color: '#fff',
        lineHeight: 20,
    },
    resetButton: {
        backgroundColor: '#27272a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#3f3f46',
        marginTop: 16,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
