import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../lib/api-client';
import { getFreeGroceryStores } from '../../lib/overpass';
import StoreListModal from '../../components/modals/StoreListModal';

interface GroceryItem {
    id: string;
    name: string;
    isChecked: boolean;
}

export default function GroceryScreen() {
    const insets = useSafeAreaInsets();

    // Core List State
    const [items, setItems] = useState<GroceryItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isActionPending, setIsActionPending] = useState(false);

    // Store State
    const [stores, setStores] = useState<any[]>([]);
    const [isLoadingStores, setIsLoadingStores] = useState(false);
    const [showStores, setShowStores] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [radius, setRadius] = useState(3);
    const [unit, setUnit] = useState<'km' | 'mi'>('km');
    const [prevRadius, setPrevRadius] = useState<number | undefined>(3);

    const fetchItems = async () => {
        try {
            const res = await api.grocery.list();
            setItems(res.data?.data || []);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load grocery list');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchItems();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchItems();
    }, []);

    const handleAdd = async () => {
        if (!newItemName.trim()) return;
        setIsActionPending(true);

        const tempId = Math.random().toString();
        const newItem = { id: tempId, name: newItemName, isChecked: false };
        setItems(prev => [newItem, ...prev]);
        setNewItemName('');

        try {
            const res = await api.grocery.add(newItem.name);
            if (res.data?.data?.id) {
                setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: res.data.data.id } : i));
            } else {
                fetchItems(); // Soft-refresh if no ID returned directly to safely map list
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to add item');
            setItems(prev => prev.filter(i => i.id !== tempId));
        } finally {
            setIsActionPending(false);
        }
    };

    const handleSeed = async () => {
        setIsActionPending(true);
        try {
            await api.grocery.seed();
            Alert.alert('Success', 'Sample list loaded');
            await fetchItems();
        } catch (e) {
            Alert.alert('Error', 'Failed to seed list');
        } finally {
            setIsActionPending(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setItems(prev => prev.map(i => i.id === id ? { ...i, isChecked: !currentStatus } : i));
        try {
            await api.grocery.toggle(id, !currentStatus);
        } catch (e) {
            // Revert
            setItems(prev => prev.map(i => i.id === id ? { ...i, isChecked: currentStatus } : i));
            Alert.alert('Error', 'Failed to update item');
        }
    };

    const handleRemove = async (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
        try {
            await api.grocery.remove(id);
        } catch (e) {
            Alert.alert('Error', 'Failed to delete item');
            fetchItems(); // Restore list state
        }
    };

    const handleClear = () => {
        if (items.length === 0) return;
        Alert.alert('Clear List', 'Are you sure you want to remove all items?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear All',
                style: 'destructive',
                onPress: async () => {
                    setItems([]);
                    try {
                        await api.grocery.clear();
                    } catch (e) {
                        Alert.alert('Error', 'Failed to clear list');
                        fetchItems();
                    }
                }
            }
        ]);
    };

    const handleFindStores = async (overrideRadius?: number, overrideUnit?: 'km' | 'mi') => {
        const searchRadius = overrideRadius || radius;
        const searchUnit = overrideUnit || unit;

        if (overrideRadius) setRadius(overrideRadius);
        if (overrideUnit) setUnit(overrideUnit);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please enable location services to find nearby stores.');
            return;
        }

        if (overrideRadius !== prevRadius || stores.length === 0) {
            setIsLoadingStores(true);
            setShowStores(true);
            setPrevRadius(overrideRadius);

            try {
                const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const lat = location.coords.latitude;
                const lng = location.coords.longitude;
                setUserLocation({ lat, lng });

                const res = await getFreeGroceryStores(lat, lng, searchRadius, searchUnit);
                if (res.success) {
                    setStores(res.elements);
                    if (res.elements.length === 0) {
                        // Just an FYI without an alert interrupting
                    }
                } else {
                    Alert.alert('Error', 'Failed to fetch nearby stores');
                }
            } catch (e) {
                Alert.alert('Error', 'Could not locate device');
            } finally {
                setIsLoadingStores(false);
            }
        } else {
            setShowStores(true);
        }
    };

    const completedCount = items.filter(i => i.isChecked).length;

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerBox]}>
                <ActivityIndicator size="large" color="#13ec5b" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Grocery List</Text>
                    <Text style={styles.subtitle}>{items.length} items • {completedCount} checked</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleClear} disabled={items.length === 0}>
                        <Ionicons name="trash-outline" size={20} color={items.length === 0 ? "#4b5563" : "#ef4444"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.storeBtn} onPress={() => handleFindStores()}>
                        <Ionicons name="location-outline" size={16} color="#000" />
                        <Text style={styles.storeBtnText}>Nearby</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal */}
            <StoreListModal
                isOpen={showStores}
                onClose={() => setShowStores(false)}
                stores={stores}
                isLoading={isLoadingStores}
                userLocation={userLocation}
                radius={radius}
                unit={unit}
                onSearchSettingsChange={handleFindStores}
            />

            {/* Input form */}
            <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                    <Ionicons name="add" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Add item (e.g., Almond Milk)..."
                        placeholderTextColor="#64748b"
                        value={newItemName}
                        onChangeText={setNewItemName}
                        onSubmitEditing={handleAdd}
                        returnKeyType="done"
                    />
                    {newItemName.trim() ? (
                        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={isActionPending}>
                            <Text style={styles.addBtnText}>Add</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* List Array */}
            <ScrollView
                style={styles.list}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#13ec5b" />}
            >
                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="search" size={28} color="#64748b" />
                        </View>
                        <Text style={styles.emptyText}>Your list is empty.</Text>
                        <Text style={styles.emptySubText}>Add items manually or from your meal plan.</Text>
                        <TouchableOpacity style={styles.seedBtn} onPress={handleSeed} disabled={isActionPending}>
                            <Text style={styles.seedBtnText}>Load Sample List</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    items.map((item) => (
                        <View key={item.id} style={[styles.itemRow, item.isChecked && styles.itemRowChecked]}>
                            <TouchableOpacity style={styles.checkboxTouch} onPress={() => handleToggle(item.id, item.isChecked)}>
                                <View style={[styles.checkbox, item.isChecked && styles.checkboxActive]}>
                                    {item.isChecked && <Ionicons name="checkmark" size={14} color="#000" />}
                                </View>
                            </TouchableOpacity>
                            <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>{item.name}</Text>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleRemove(item.id)}>
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    centerBox: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#a1a1aa',
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        width: 36,
        height: 36,
        backgroundColor: '#1c1c1e',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    storeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#13ec5b',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    storeBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 13,
        marginLeft: 4,
    },
    formContainer: {
        padding: 20,
        paddingBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1e',
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
        borderColor: '#333',
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
    },
    addBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        marginLeft: 8,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#1c1c1e',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubText: {
        color: '#64748b',
        fontSize: 14,
        marginBottom: 24,
    },
    seedBtn: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    seedBtnText: {
        color: '#475569',
        fontWeight: 'bold',
        fontSize: 14,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1e',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    itemRowChecked: {
        opacity: 0.6,
        borderColor: 'transparent',
    },
    checkboxTouch: {
        padding: 4,
        marginRight: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#64748b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#13ec5b',
        borderColor: '#13ec5b',
    },
    itemName: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    itemNameChecked: {
        color: '#64748b',
        textDecorationLine: 'line-through',
    },
    deleteBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
});
