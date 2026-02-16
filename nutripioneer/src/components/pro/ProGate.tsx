'use client';

import { Lock, Check, ArrowRight } from 'lucide-react';
import { SubscribeButton } from '@/components/SubscribeButton';
import Link from 'next/link';
import styles from '@/styles/ProGate.module.css';

interface ProGateProps {
    isPro: boolean;
    feature: string;
    description?: string;
    benefits?: string[];
    children: React.ReactNode;
    mode?: 'block' | 'readonly' | 'overlay';
    className?: string;
}

export default function ProGate({
    isPro,
    feature,
    description,
    benefits = [],
    children,
    mode = 'block',
    className = '',
    rootClassName = '',
    rootStyle = {},
}: ProGateProps & { rootClassName?: string; rootStyle?: React.CSSProperties }) {
    if (isPro) {
        return <>{children}</>;
    }

    const renderUpgradeUI = () => (
        <div className={`${styles.upgradeContainer} ${styles[mode]} ${className}`}>
            <div className={styles.upgradeContent}>
                {/* Badge */}
                <div className={styles.proBadge}>
                    <Lock size={14} />
                    Pro Feature
                </div>

                {/* Title */}
                <h3 className={styles.featureTitle}>{feature}</h3>

                {/* Description */}
                {description && <p className={styles.featureDescription}>{description}</p>}

                {/* Benefits */}
                {benefits.length > 0 && (
                    <ul className={styles.benefitsList}>
                        {benefits.map((benefit, idx) => (
                            <li key={idx}>
                                <Check size={16} className={styles.checkIcon} />
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* CTA */}
                <div className={styles.ctaSection}>
                    <SubscribeButton />
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Unlock {feature}
                    </p>
                </div>
            </div>
        </div>
    );

    if (mode === 'block') {
        return renderUpgradeUI();
    }

    if (mode === 'readonly') {
        return (
            <div className={styles.readonlyWrapper}>
                <div className={styles.readonlyContent}>{children}</div>
                <div className={styles.readonlyOverlay}>{renderUpgradeUI()}</div>
            </div>
        );
    }

    // overlay mode
    return (
        <div style={{ position: 'relative', ...rootStyle }} className={rootClassName}>
            {children}
            {renderUpgradeUI()}
            {mode === 'overlay' && <div className={styles.backdrop} />}
        </div>
    );
}
