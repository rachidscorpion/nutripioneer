'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/TimePicker.module.css';

interface ModernTimePickerProps {
    value: string; // "HH:MM" 24h format
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
}

export default function ModernTimePicker({ value, onChange, label, disabled = false }: ModernTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parsing current value
    const [hours24, minutes] = value ? value.split(':').map(Number) : [9, 0];

    const hours12 = hours24 % 12 || 12;
    const isPm = hours24 >= 12;
    const period = isPm ? 'PM' : 'AM';

    // Formatting for display
    const displayTime = value ? `${hours12}:${minutes.toString().padStart(2, '0')} ${period}` : '--:--';

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleHourSelect = (h: number) => {
        const newHour24 = period === 'PM'
            ? (h === 12 ? 12 : h + 12)
            : (h === 12 ? 0 : h);

        onChange(`${newHour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    };

    const handleMinuteSelect = (m: number) => {
        onChange(`${hours24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };

    const togglePeriod = () => {
        const newHour24 = (hours24 + 12) % 24;
        onChange(`${newHour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    };

    return (
        <div className={styles.timePickerContainer} ref={containerRef}>
            {label && <label className={styles.label}>{label}</label>}

            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`${styles.triggerBtn} ${isOpen ? styles.open : ''}`}
            >
                <div className={styles.iconWrapper}>
                    <Clock size={14} />
                </div>
                <span className={styles.timeText}>
                    {displayTime}
                </span>
                <ChevronDown size={14} className={styles.chevron} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={styles.dropdown}
                    >
                        {/* Hours Column */}
                        <div className={styles.column}>
                            <span className={styles.columnHeader}>Hr</span>
                            <div style={{ display: 'grid', gap: '0.25rem' }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => handleHourSelect(h)}
                                        className={`${styles.timeBtn} ${h === hours12 ? styles.active : ''}`}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className={styles.divider} />

                        {/* Minutes Column */}
                        <div className={styles.column}>
                            <span className={styles.columnHeader}>Min</span>
                            <div style={{ display: 'grid', gap: '0.25rem' }}>
                                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => handleMinuteSelect(m)}
                                        className={`${styles.timeBtn} ${m === minutes ? styles.active : ''}`}
                                    >
                                        {m.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AM/PM Column */}
                        <div className={styles.periodColumn}>
                            <button
                                onClick={() => period !== 'AM' && togglePeriod()}
                                className={`${styles.periodBtn} ${styles.periodBtnAM} ${period === 'AM' ? styles.active : ''}`}
                            >
                                AM
                            </button>
                            <button
                                onClick={() => period !== 'PM' && togglePeriod()}
                                className={`${styles.periodBtn} ${styles.periodBtnPM} ${period === 'PM' ? styles.active : ''}`}
                            >
                                PM
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
