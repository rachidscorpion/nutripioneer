'use client';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ExternalLink, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from '@/styles/StoreListModal.module.css';

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!mounted) return null;

    // Helper to calculate distance (Haversine formula)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = unit === 'km' ? 6371 : 3959; // Radius in km or miles
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d.toFixed(1);
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    }

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Wrapper */}
                    <motion.div
                        className={styles.modalWrapper}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Modal Card */}
                        <motion.div
                            className={styles.modalContent}
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                        >
                            {/* Header */}
                            <div className={styles.header}>
                                <div>
                                    <h2 className={styles.title}>
                                        <Store className="text-blue-500" size={24} style={{ color: '#3b82f6' }} />
                                        Nearby Stores
                                    </h2>
                                    <p className={styles.subtitle}>Found {stores.length} locations within {radius}{unit}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    {/* Radius Selector */}
                                    <select
                                        value={radius}
                                        onChange={(e) => onSearchSettingsChange(Number(e.target.value), unit)}
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid #e2e8f0',
                                            background: '#f8fafc',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                        disabled={isLoading}
                                    >
                                        {[3, 6, 8, 10].map(r => (
                                            <option key={r} value={r}>{r} {unit}</option>
                                        ))}
                                    </select>

                                    {/* Unit Toggle */}
                                    <button
                                        onClick={() => onSearchSettingsChange(radius, unit === 'km' ? 'mi' : 'km')}
                                        disabled={isLoading}
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            border: '1px solid #e2e8f0',
                                            background: '#f8fafc',
                                            color: '#64748b',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {unit.toUpperCase()}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className={styles.closeBtn}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className={styles.body}>
                                {isLoading ? (
                                    <div className={styles.loadingState}>
                                        <div className={styles.spinner}></div>
                                        <p style={{ fontSize: '0.875rem' }}>Locating nearby stores...</p>
                                    </div>
                                ) : stores.length > 0 ? (
                                    <div className={styles.list}>
                                        {stores.map((store, i) => {
                                            const lat = store.lat || store.center?.lat;
                                            const lon = store.lon || store.center?.lon;
                                            const distance = userLocation ? getDistance(userLocation.lat, userLocation.lng, lat, lon) : null;

                                            return (
                                                <div
                                                    key={i}
                                                    className={styles.storeCard}
                                                >
                                                    <div>
                                                        <h3 className={styles.storeName}>
                                                            {store.tags?.name || 'Unnamed Store'}
                                                        </h3>
                                                        <div className={styles.storeMeta}>
                                                            <span className={styles.storeType}>
                                                                {store.tags?.shop?.replace('_', ' ') || 'Store'}
                                                            </span>
                                                            {distance && (
                                                                <span>• {distance} {unit} away</span>
                                                            )}
                                                        </div>
                                                        {store.tags?.opening_hours && (
                                                            <p className={styles.storeHours}>
                                                                🕒 {store.tags.opening_hours}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={styles.mapLink}
                                                        title="View on Map"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>
                                        <MapPin size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                        <p>No stores found nearby.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className={styles.footer}>
                                Data provided by OpenStreetMap
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
