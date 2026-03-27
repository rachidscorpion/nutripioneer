import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface SourceLink {
    label: string;
    url: string;
}

interface SourceCitationBannerProps {
    /** Main attribution text, e.g. "Nutritional data from Edamam" */
    text: string;
    /** Optional list of source links */
    sources?: SourceLink[];
    /** Optional additional disclaimer text */
    disclaimer?: string;
    /** Compact mode for inline usage in cards */
    compact?: boolean;
}

export default function SourceCitationBanner({ text, sources, disclaimer, compact = false }: SourceCitationBannerProps) {
    const { theme } = useTheme();

    if (compact) {
        return (
            <View style={[styles.compactContainer, { borderTopColor: theme.border }]}>
                <Ionicons name="information-circle-outline" size={12} color={theme.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.compactText, { color: theme.textMuted }]}>
                    {text}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.headerRow}>
                <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.text, { color: theme.textMuted }]}>{text}</Text>
            </View>

            {sources && sources.length > 0 && (
                <View style={styles.linksContainer}>
                    {sources.map((source, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => Linking.openURL(source.url)}
                            style={[styles.linkChip, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}
                        >
                            <Ionicons name="open-outline" size={10} color={theme.primary} style={{ marginRight: 4 }} />
                            <Text style={[styles.linkText, { color: theme.primary }]}>{source.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {disclaimer && (
                <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
                    {disclaimer}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    text: {
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
    linksContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: 6,
        marginTop: 8,
    },
    linkChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    linkText: {
        fontSize: 11,
        fontWeight: '600',
    },
    disclaimer: {
        fontSize: 11,
        fontStyle: 'italic',
        marginTop: 8,
        lineHeight: 16,
    },
    // Compact variant
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
        marginTop: 8,
        borderTopWidth: 1,
    },
    compactText: {
        fontSize: 11,
        flex: 1,
    },
});
