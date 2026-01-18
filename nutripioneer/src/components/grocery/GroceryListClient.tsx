'use client';
import { useState, useTransition } from 'react';
import { Plus, Trash2, Check, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { getFreeGroceryStores } from '@/lib/overpass';
import StoreListModal from '@/components/modals/StoreListModal';
import styles from '@/styles/GroceryList.module.css';

interface GroceryItem {
    id: string;
    name: string;
    isChecked: boolean;
}

export default function GroceryListClient({ initialItems }: { initialItems: GroceryItem[] }) {
    const [items, setItems] = useState<GroceryItem[]>(initialItems);
    const [newItemName, setNewItemName] = useState('');
    const [isPending, startTransition] = useTransition();
    const [prevRadius, setPrevRadius] = useState<number | undefined>(3);

    // Store State
    const [stores, setStores] = useState<any[]>([]);
    const [isLoadingStores, setIsLoadingStores] = useState(false);
    const [showStores, setShowStores] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [radius, setRadius] = useState(3);
    const [unit, setUnit] = useState<'km' | 'mi'>('km');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        // Optimistic update
        const tempId = Math.random().toString();
        const newItem = { id: tempId, name: newItemName, isChecked: false };
        setItems(prev => [newItem, ...prev]);
        setNewItemName('');

        startTransition(async () => {
            try {
                const res = await api.grocery.add(newItem.name);
                // Update with real ID if needed, but for now optimistic is fine or we reload
                // Better to update id:
                if (res.data && res.data.id) {
                    setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: res.data.id } : i));
                }
            } catch (e) {
                toast.error('Failed to add item');
                setItems(prev => prev.filter(i => i.id !== tempId));
            }
        });
    };

    const handleSeed = async () => {
        startTransition(async () => {
            try {
                await api.grocery.seed();
                toast.success('Sample list loaded');
                window.location.reload();
            } catch (e) {
                toast.error('Failed to seed list');
            }
        });
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, isChecked: !currentStatus } : i));

        startTransition(async () => {
            try {
                await api.grocery.toggle(id, !currentStatus);
            } catch (e) {
                // Revert
                setItems(prev => prev.map(i => i.id === id ? { ...i, isChecked: currentStatus } : i));
            }
        });
    };

    const handleRemove = async (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
        startTransition(async () => {
            try {
                await api.grocery.remove(id);
            } catch (e) {
                toast.error("Failed to delete");
                // tricky to revert delete without keeping item
            }
        });
    };

    const handleClear = async () => {
        if (items.length === 0) return;
        if (!confirm('Clear all items?')) return;
        setItems([]);
        startTransition(async () => {
            try {
                await api.grocery.clear();
            } catch (e) {
                toast.error("Failed to clear");
                window.location.reload();
            }
        });
    };

    const handleFindStores = (overrideRadius?: number, overrideUnit?: 'km' | 'mi') => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        const searchRadius = overrideRadius || radius;
        const searchUnit = overrideUnit || unit;

        // Update state if overrides provided
        if (overrideRadius) setRadius(overrideRadius);
        if (overrideUnit) setUnit(overrideUnit);

        if (overrideRadius !== prevRadius) {
            setIsLoadingStores(true);
            setShowStores(true);
            setPrevRadius(overrideRadius);
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                try {
                    const res = await getFreeGroceryStores(latitude, longitude, searchRadius, searchUnit);
                    if (res.success) {
                        setStores(res.elements);
                        if (res.elements.length === 0) toast.info(`No stores found nearby (${searchRadius}${searchUnit})`);
                    } else {
                        toast.error('Failed to fetch stores');
                    }
                } catch (e) {
                    toast.error('Error finding stores');
                } finally {
                    setIsLoadingStores(false);
                }
            }, (error) => {
                console.error(error);
                toast.error('Unable to retrieve your location');
                setIsLoadingStores(false);
                setShowStores(false);
            });
        }


    };

    const completedCount = items.filter(i => i.isChecked).length;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Grocery List</h1>
                    <p className={styles.subtitle}>
                        {items.length} items • {completedCount} checked
                    </p>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.iconBtn}
                        onClick={handleClear}
                        title="Clear All"
                        disabled={items.length === 0}
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        className={styles.storeBtn}
                        onClick={() => handleFindStores()}
                    >
                        <MapPin size={16} />
                        Nearby Stores
                    </button>
                </div>
            </header>

            {/* Modal for Stores */}
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

            {/* Add Item Form */}
            <form onSubmit={handleAdd} className={styles.form}>
                <div className={styles.inputWrapper}>
                    <Plus className={styles.plusIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Add item (e.g., Almond Milk)..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className={styles.input}
                    />
                    {newItemName.trim() && (
                        <button
                            type="submit"
                            disabled={isPending}
                            className={styles.addBtn}
                        >
                            Add
                        </button>
                    )}
                </div>
            </form>

            <div className={styles.list}>
                {items.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Search size={24} color="#94a3b8" />
                        </div>
                        <p>Your list is empty.</p>
                        <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Add items manually or from your meal plan.</p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={handleSeed}
                                disabled={isPending}
                                style={{
                                    padding: '0.5rem 1rem', background: '#e2e8f0', color: '#475569',
                                    borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600
                                }}
                            >
                                Load Sample List
                            </button>
                        </div>
                    </div>
                )}

                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`${styles.item} ${item.isChecked ? styles.itemCompleted : ''}`}
                    >
                        <button
                            onClick={() => handleToggle(item.id, item.isChecked)}
                            className={`${styles.checkbox} ${item.isChecked ? styles.checkboxChecked : ''}`}
                        >
                            {item.isChecked && <Check size={14} color="white" />}
                        </button>

                        <span className={`${styles.itemName} ${item.isChecked ? styles.itemNameCompleted : ''}`}>
                            {item.name}
                        </span>

                        <button
                            onClick={() => handleRemove(item.id)}
                            className={styles.deleteBtn}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
