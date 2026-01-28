'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/MenuScanner.module.css';

interface MenuScannerProps {
    onImageSelected: (file: File) => void;
    isScanning: boolean;
}

export default function MenuScanner({ onImageSelected, isScanning }: MenuScannerProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files?.[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            toast.error('Image too large. Maximum size is 20MB');
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleScan = () => {
        if (selectedFile) {
            onImageSelected(selectedFile);
        }
    };

    const handleReset = () => {
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 30
            }
        },
        exit: { opacity: 0, y: -20 }
    };

    return (
        <div className={styles.container}>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className={styles.card}
            >
                <div className={styles.header}>
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            type: "spring" as const,
                            stiffness: 260,
                            damping: 20,
                            delay: 0.1
                        }}
                        className={styles.iconWrapper}
                    >
                        <Camera size={40} strokeWidth={1.5} />
                    </motion.div>
                    <h1 className={styles.title}>
                        Restaurant Menu Rescue
                    </h1>
                    <p className={styles.subtitle}>
                        Snap a photo of any menu to instantly find dishes that match your dietary needs.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!preview ? (
                        <motion.div
                            key="dropzone"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
                            onDragEnter={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragActive(true);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragActive(false);
                            }}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className={styles.uploadIcon}>
                                <Upload size={64} strokeWidth={1} />
                            </div>
                            <p className={styles.dropText}>
                                Drop your menu image here
                            </p>
                            <p className={styles.dropSubtext}>
                                or click anywhere to browse
                            </p>
                            <button
                                type="button"
                                className={`${styles.button} ${styles.buttonPrimary}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                <ImageIcon size={20} />
                                Select Image
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileSelect}
                                className={styles.fileInput}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <div className={styles.preview}>
                                <img
                                    src={preview}
                                    alt="Menu preview"
                                />
                                <button
                                    onClick={handleReset}
                                    className={styles.resetButton}
                                    title="Remove image"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className={styles.buttonGroup}>
                                <button
                                    onClick={handleReset}
                                    disabled={isScanning}
                                    className={`${styles.button} ${styles.buttonSecondary}`}
                                >
                                    Change Photo
                                </button>
                                <button
                                    onClick={handleScan}
                                    disabled={isScanning}
                                    className={`${styles.button} ${styles.buttonPrimary}`}
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 size={20} className={styles.spin} />
                                            Analyzing Menu...
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={20} />
                                            Scan Menu
                                        </>
                                    )}
                                </button>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className={styles.tipBox}
                            >
                                <div className="text-blue-600">
                                    <Camera size={20} />
                                </div>
                                <p className={styles.tipText}>
                                    <strong>Pro Tip:</strong> Ensure the menu text is sharp and well-lit. If the menu has multiple pages, scan one page at a time.
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={styles.infoSection}>
                    <h3 className={styles.infoTitle}>Analysis Guide</h3>
                    <div className={styles.infoGrid}>
                        <div className={`${styles.infoCard} ${styles.infoCardSafe}`}>
                            <div className={`${styles.infoHeader} ${styles.infoHeaderSafe}`}>
                                <div className={`${styles.statusDot} ${styles.statusDotSafe}`}></div>
                                <span>Safe</span>
                            </div>
                            <p className={`${styles.infoText} ${styles.infoTextSafe}`}>
                                No conflict with your dietary restrictions.
                            </p>
                        </div>
                        <div className={`${styles.infoCard} ${styles.infoCardCaution}`}>
                            <div className={`${styles.infoHeader} ${styles.infoHeaderCaution}`}>
                                <div className={`${styles.statusDot} ${styles.statusDotCaution}`}></div>
                                <span>Caution</span>
                            </div>
                            <p className={`${styles.infoText} ${styles.infoTextCaution}`}>
                                Requires simple modifications to be safe.
                            </p>
                        </div>
                        <div className={`${styles.infoCard} ${styles.infoCardAvoid}`}>
                            <div className={`${styles.infoHeader} ${styles.infoHeaderAvoid}`}>
                                <div className={`${styles.statusDot} ${styles.statusDotAvoid}`}></div>
                                <span>Avoid</span>
                            </div>
                            <p className={`${styles.infoText} ${styles.infoTextAvoid}`}>
                                Contains ingredients you should avoid.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
