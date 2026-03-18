import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SubscribeButton from './SubscribeButton';

interface ProGateProps {
    isPro: boolean;
    feature: string;
    description?: string;
    benefits?: string[];
    children: React.ReactNode;
    mode?: 'block' | 'readonly' | 'overlay';
}

/**
 * ProGate – gates content behind a Pro subscription wall.
 *
 * Modes:
 *  - block    → replaces the children entirely with upgrade CTA
 *  - readonly → shows children dimmed with an overlay CTA
 *  - overlay  → shows children with a translucent overlay CTA
 */
export default function ProGate({
    isPro,
    feature,
    description,
    benefits = [],
    children,
    mode = 'block',
}: ProGateProps) {
    if (isPro) {
        return <>{children}</>;
    }

    const renderUpgradeUI = () => (
        <View style={styles.upgradeContainer}>
            <View style={styles.upgradeContent}>
                {/* Badge */}
                <View style={styles.proBadge}>
                    <Ionicons name="lock-closed" size={14} color="#fff" />
                    <Text style={styles.proBadgeText}>Pro Feature</Text>
                </View>

                {/* Title */}
                <Text style={styles.featureTitle}>{feature}</Text>

                {/* Description */}
                {description ? (
                    <Text style={styles.featureDescription}>{description}</Text>
                ) : null}

                {/* Benefits */}
                {benefits.length > 0 && (
                    <View style={styles.benefitsList}>
                        {benefits.map((benefit, idx) => (
                            <View key={idx} style={styles.benefitRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* CTA */}
                <View style={styles.ctaSection}>
                    <SubscribeButton />
                    <Text style={styles.ctaHint}>Unlock {feature}</Text>
                </View>
            </View>
        </View>
    );

    if (mode === 'block') {
        return renderUpgradeUI();
    }

    if (mode === 'readonly') {
        return (
            <View style={styles.readonlyWrapper}>
                <View style={styles.readonlyContent} pointerEvents="none">
                    {children}
                </View>
                <View style={styles.readonlyOverlay}>
                    {renderUpgradeUI()}
                </View>
            </View>
        );
    }

    // overlay mode
    return (
        <View style={{ position: 'relative' }}>
            {children}
            <View style={styles.overlayBackdrop} />
            {renderUpgradeUI()}
        </View>
    );
}

const styles = StyleSheet.create({
    upgradeContainer: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upgradeContent: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        width: '100%',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    proBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
        letterSpacing: 0.5,
    },
    featureTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    featureDescription: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    benefitsList: {
        width: '100%',
        marginBottom: 20,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    benefitText: {
        color: '#d1d5db',
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
    ctaSection: {
        width: '100%',
        alignItems: 'center',
    },
    ctaHint: {
        marginTop: 8,
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
    },
    readonlyWrapper: {
        position: 'relative',
    },
    readonlyContent: {
        opacity: 0.35,
    },
    readonlyOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    overlayBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 5,
    },
});
