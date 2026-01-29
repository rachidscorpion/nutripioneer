'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, ClipboardList, Heart, User, ShoppingBag, Camera } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from '@/styles/Components.module.css';

const NAV_ITEMS = [
    { id: 'home', icon: Home, label: 'Home', path: '/home' },
    { id: 'grocery', icon: ShoppingBag, label: 'Grocery', path: '/grocery' },
    { id: 'plan', icon: ClipboardList, label: 'Plan', path: '/plan' },
    { id: 'restaurant', icon: Camera, label: 'Scan Menu', path: '/restaurant-rescue' },
    // { id: 'health', icon: Heart, label: 'Health', path: '/health' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' }
];

export default function FloatingDock() {
    const pathname = usePathname();
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    return (
        <div className={styles.dockContainer}>
            <motion.div
                className={styles.dock}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
            >
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/home' && pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                            onMouseEnter={() => setHoveredTab(item.id)}
                            onMouseLeave={() => setHoveredTab(null)}
                        >
                            <AnimatePresence>
                                {hoveredTab === item.id && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, x: "-50%" }}
                                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                                        exit={{ opacity: 0, y: 2, x: "-50%" }}
                                        transition={{ duration: 0.2 }}
                                        className={styles.tooltip}
                                    >
                                        {item.label}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div style={{ position: 'relative', zIndex: 10 }}>
                                <motion.div
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <item.icon
                                        size={24}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                </motion.div>
                            </div>

                            {isActive && (
                                <motion.div
                                    layoutId="active-nav-pill"
                                    className={styles.activePill}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </Link>
                    )
                })}
            </motion.div>
        </div>
    );
}
