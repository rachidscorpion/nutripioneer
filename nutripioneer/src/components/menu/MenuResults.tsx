'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, X, ChevronDown, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import styles from '@/styles/MenuResults.module.css';

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

interface MenuResultsProps {
    result: MenuAnalysisResult;
    onReset: () => void;
}

const getStatusIcon = (status: MenuItem['status']) => {
    switch (status) {
        case 'SAFE':
            return <Check className={styles.iconSafe} size={20} strokeWidth={2.5} />;
        case 'CAUTION':
            return <AlertTriangle className={styles.iconCaution} size={20} strokeWidth={2.5} />;
        case 'AVOID':
            return <X className={styles.iconAvoid} size={20} strokeWidth={2.5} />;
    }
};

const getStatusBadge = (status: MenuItem['status']) => {
    const badgeClass = status === 'SAFE'
        ? styles.badgeSafe
        : status === 'CAUTION'
            ? styles.badgeCaution
            : styles.badgeAvoid;

    return (
        <span className={`${styles.badge} ${badgeClass}`}>
            {status}
        </span>
    );
};

const getItemCardClass = (status: MenuItem['status']) => {
    const statusClass = status === 'SAFE'
        ? 'Safe'
        : status === 'CAUTION'
            ? 'Caution'
            : 'Avoid';
    return `${styles.itemCard} ${styles['itemCard' + statusClass]}`;
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 20
        }
    }
};

interface ItemCardProps {
    item: MenuItem;
    isExpanded: boolean;
    onToggle: () => void;
}

const ItemCard = ({ item, isExpanded, onToggle }: ItemCardProps) => (
    <motion.div
        variants={itemVariants}
        className={getItemCardClass(item.status)}
    >
        <button
            onClick={onToggle}
            className={styles.itemHeader}
            type="button"
        >
            <div className={styles.itemContent}>
                <div className={styles.itemNameRow}>
                    {getStatusIcon(item.status)}
                    <h3 className={styles.itemName}>{item.name}</h3>
                    {getStatusBadge(item.status)}
                </div>
                {item.description && (
                    <p className={styles.itemDescription}>{item.description}</p>
                )}
            </div>
            <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
            >
                <ChevronDown className="text-gray-400" size={20} />
            </motion.div>
        </button>
        <AnimatePresence initial={false}>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={styles.itemDetails}
                >
                    <div className={styles.detailsContent}>
                        <div className={styles.detailsSection}>
                            <p className={styles.detailsLabel}>Nutrition Analysis</p>
                            <p className={styles.detailsText}>{item.reasoning}</p>
                        </div>
                        {item.modification && (
                            <div className={styles.modificationBox}>
                                <p className={styles.detailsLabel} style={{ color: '#2563eb', marginBottom: '0.25rem' }}>
                                    Recommended Modification
                                </p>
                                <p className={styles.modificationText}>{item.modification}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

export default function MenuResults({ result, onReset }: MenuResultsProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleExpand = (name: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    };

    const safeItems = result.items.filter((item) => item.status === 'SAFE');
    const cautionItems = result.items.filter((item) => item.status === 'CAUTION');
    const avoidItems = result.items.filter((item) => item.status === 'AVOID');

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={styles.hero}
            >
                <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-full mb-4 text-blue-600">
                    <Check size={32} />
                </div>
                <h1 className={styles.title}>Menu Analyzed</h1>
                <p className={styles.summary}>{result.summary}</p>
            </motion.div>

            <div className={styles.statsGrid}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`${styles.statCard} ${styles.statCardSafe}`}
                >
                    <div className={`${styles.statValue} ${styles.statValueSafe}`}>{safeItems.length}</div>
                    <div className={`${styles.statLabel} ${styles.statLabelSafe}`}>Safe Changes</div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`${styles.statCard} ${styles.statCardCaution}`}
                >
                    <div className={`${styles.statValue} ${styles.statValueCaution}`}>{cautionItems.length}</div>
                    <div className={`${styles.statLabel} ${styles.statLabelCaution}`}>
                        Caution Items
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className={`${styles.statCard} ${styles.statCardAvoid}`}
                >
                    <div className={`${styles.statValue} ${styles.statValueAvoid}`}>{avoidItems.length}</div>
                    <div className={`${styles.statLabel} ${styles.statLabelAvoid}`}>Avoid Items</div>
                </motion.div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {safeItems.length > 0 && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mr-2">
                                <Check size={18} strokeWidth={3} />
                            </span>
                            Safe to Order
                        </h2>
                        <div className={styles.itemList}>
                            {safeItems.map((item) => (
                                <ItemCard
                                    key={item.name}
                                    item={item}
                                    isExpanded={expandedItems.has(item.name)}
                                    onToggle={() => toggleExpand(item.name)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {cautionItems.length > 0 && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 mr-2">
                                <AlertTriangle size={18} strokeWidth={3} />
                            </span>
                            Order with Modifications
                        </h2>
                        <div className={styles.itemList}>
                            {cautionItems.map((item) => (
                                <ItemCard
                                    key={item.name}
                                    item={item}
                                    isExpanded={expandedItems.has(item.name)}
                                    onToggle={() => toggleExpand(item.name)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {avoidItems.length > 0 && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 mr-2">
                                <X size={18} strokeWidth={3} />
                            </span>
                            Should Avoid
                        </h2>
                        <div className={styles.itemList}>
                            {avoidItems.map((item) => (
                                <ItemCard
                                    key={item.name}
                                    item={item}
                                    isExpanded={expandedItems.has(item.name)}
                                    onToggle={() => toggleExpand(item.name)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className={styles.footer}
            >
                <button onClick={onReset} className={styles.resetButton}>
                    <RefreshCw size={20} />
                    Scan Another Menu
                </button>
            </motion.div>

            <div className={styles.disclaimer}>
                <p className={styles.disclaimerText}>
                    <strong>Medical Disclaimer:</strong> This analysis is generated by AI based on general nutritional data.
                    It is not medical advice. Please cross-reference with your own knowledge and consult your healthcare provider.
                </p>
            </div>
        </div>
    );
}
