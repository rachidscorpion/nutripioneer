'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import styles from '@/styles/ConfirmationModal.module.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    isLoading = false
}: ConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoading ? onClose : undefined}
                    />

                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5001 }}>
                        <motion.div
                            className={styles.modalWrapper}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            style={{ pointerEvents: 'auto' }}
                        >
                            <div className={styles.modalContent}>
                                <div className={styles.header}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {isDanger && <AlertTriangle size={24} color="#ef4444" />}
                                        <h3 className={styles.title}>{title}</h3>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className={styles.closeButton}
                                        disabled={isLoading}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className={styles.body}>
                                    {message}
                                </div>

                                <div className={styles.footer}>
                                    <button
                                        className={`${styles.button} ${styles.cancelButton}`}
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        className={`${styles.button} ${isDanger ? styles.dangerButton : styles.confirmButton}`}
                                        onClick={onConfirm}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Processing...' : confirmText}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
