import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StoreListModalProps {
    isOpen: boolean;
    onClose: () => void;
    stores: any[];
    isLoading: boolean;
    userLocation?: { lat: number; lng: number } | null;
    radius: number;
    unit: 'km' | 'mi';
    onSearchSettingsChange: (radius?: number, unit?: 'km' | 'mi') => void;
}

export default function StoreListModal({ isOpen, onClose, stores, isLoading, userLocation, radius, unit, onSearchSettingsChange }: StoreListModalProps) {
    const insets = useSafeAreaInsets();

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = unit === 'km' ? 6371 : 3959;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d.toFixed(1);
    };

    return (
        <Modal visible={isOpen} transparent animationType="slide">
            <View style={styles.backdrop}>
                <View style={[styles.modalContent, { marginTop: insets.top + 20, marginBottom: insets.bottom + 20 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.titleRow}>
                                <Ionicons name="storefront" size={24} color="#3b82f6" />
                                <Text style={styles.title}>Nearby Stores</Text>
                            </View>
                            <Text style={styles.subtitle}>Found {stores.length} locations within {radius}{unit}</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Bar */}
                    <View style={styles.filterRow}>
                        <View style={styles.radiusTabs}>
                            {[3, 6, 8, 10].map(r => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                                    onPress={() => onSearchSettingsChange(r, unit)}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.unitToggle}
                            onPress={() => onSearchSettingsChange(radius, unit === 'km' ? 'mi' : 'km')}
                            disabled={isLoading}
                        >
                            <Text style={styles.unitText}>{unit.toUpperCase()}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <View style={styles.body}>
                        {isLoading ? (
                            <View style={styles.centerBox}>
                                <ActivityIndicator size="large" color="#3b82f6" />
                                <Text style={styles.loadingText}>Locating nearby stores...</Text>
                            </View>
                        ) : stores.length > 0 ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {stores.map((store, i) => {
                                    const lat = store.lat || store.center?.lat;
                                    const lon = store.lon || store.center?.lon;
                                    const distance = userLocation ? getDistance(userLocation.lat, userLocation.lng, lat, lon) : null;

                                    return (
                                        <View key={i} style={styles.storeCard}>
                                            <View style={styles.storeInfo}>
                                                <Text style={styles.storeName}>{store.tags?.name || 'Unnamed Store'}</Text>
                                                <View style={styles.storeMeta}>
                                                    <Text style={styles.storeType}>{store.tags?.shop?.replace('_', ' ') || 'Store'}</Text>
                                                    {distance && <Text style={styles.storeDistance}> • {distance} {unit} away</Text>}
                                                </View>
                                                {store.tags?.opening_hours && (
                                                    <Text style={styles.storeHours}><Ionicons name="time-outline" size={12} /> {store.tags.opening_hours}</Text>
                                                )}
                                            </View>
                                            <TouchableOpacity
                                                style={styles.mapBtn}
                                                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`)}
                                            >
                                                <Ionicons name="map-outline" size={20} color="#3b82f6" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={styles.centerBox}>
                                <Ionicons name="location-outline" size={48} color="#475569" style={{ opacity: 0.5, marginBottom: 8 }} />
                                <Text style={styles.emptyText}>No stores found nearby.</Text>
                            </View>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Data provided by OpenStreetMap</Text>
                    </View>
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
        padding: 20,
        paddingBottom: 15,
        alignItems: 'flex-start',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 8,
    },
    subtitle: {
        color: '#9ca3af',
        fontSize: 14,
    },
    closeBtn: {
        padding: 4,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#2c2c2e',
    },
    radiusTabs: {
        flexDirection: 'row',
        backgroundColor: '#2c2c2e',
        borderRadius: 8,
        padding: 2,
    },
    radiusBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    radiusBtnActive: {
        backgroundColor: '#3b82f6',
    },
    radiusText: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
    },
    radiusTextActive: {
        color: '#fff',
    },
    unitToggle: {
        backgroundColor: '#2c2c2e',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    unitText: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: 'bold',
    },
    body: {
        flex: 1,
        padding: 20,
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#64748b',
        marginTop: 12,
        fontSize: 14,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 14,
    },
    storeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#2c2c2e',
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    storeInfo: {
        flex: 1,
    },
    storeName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    storeMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    storeType: {
        color: '#9ca3af',
        fontSize: 13,
        textTransform: 'capitalize',
    },
    storeDistance: {
        color: '#64748b',
        fontSize: 13,
    },
    storeHours: {
        color: '#10b981',
        fontSize: 12,
    },
    mapBtn: {
        padding: 10,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 12,
        marginLeft: 12,
    },
    footer: {
        padding: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#2c2c2e',
    },
    footerText: {
        color: '#475569',
        fontSize: 12,
    }
});
