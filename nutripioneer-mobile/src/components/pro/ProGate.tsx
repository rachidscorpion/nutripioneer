import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
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
    const { theme, isDark } = useTheme();

    if (isPro) {
        return <>{children}</>;
    }

    const renderUpgradeUI = () => (
        <View style={styles.upgradeContainer}>
            <View style={[styles.upgradeContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {/* Badge */}
                <View style={[styles.proBadge, { backgroundColor: theme.primary + '1A' }]}>
                    <Ionicons name="lock-closed" size={14} color={theme.primary} />
                    <Text style={[styles.proBadgeText, { color: theme.primary }]}>Pro Feature</Text>
                </View>

                {/* Title */}
                <Text style={[styles.featureTitle, { color: theme.text }]}>{feature}</Text>

                {/* Description */}
                {description ? (
                    <Text style={[styles.featureDescription, { color: theme.textMuted }]}>{description}</Text>
                ) : null}

                {/* Benefits */}
                {benefits.length > 0 && (
                    <View style={styles.benefitsList}>
                        {benefits.map((benefit, idx) => (
                            <View key={idx} style={styles.benefitRow}>
                                <Ionicons name="checkmark-circle" size={16} color={theme.primary} style={{ marginTop: 2 }} />
                                <Text style={[styles.benefitText, { color: theme.textMuted }]}>{benefit}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* CTA */}
                <View style={styles.ctaSection}>
                    <SubscribeButton />
                    <Text style={[styles.ctaHint, { color: theme.textMuted }]}>Unlock {feature}</Text>
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
            <View style={[styles.overlayBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }]} />
            {renderUpgradeUI()}
        </View>
    );
}

const styles = StyleSheet.create({
    upgradeContainer: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 800,
        alignSelf: 'center',
    },
    upgradeContent: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        width: '100%',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    proBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
        letterSpacing: 0.5,
    },
    featureTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    benefitsList: {
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    benefitRow: {
        flexDirection: 'row',
        direction: 'ltr',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    benefitText: {
        fontSize: 14,
        marginLeft: 10,
        flexShrink: 1,
        textAlign: 'left',
    },
    ctaSection: {
        width: '100%',
        alignItems: 'center',
    },
    ctaHint: {
        marginTop: 8,
        fontSize: 13,
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
        zIndex: 5,
    },
});
