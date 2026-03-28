import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

interface DashboardHeaderProps {
    onSearchPress?: () => void;
    onMenuPress?: () => void;
}

export default function DashboardHeader({ onSearchPress, onMenuPress }: DashboardHeaderProps) {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), backgroundColor: theme.background }]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.dateText, { color: theme.primary }]}>{dateString}</Text>
                <Text style={[styles.title, { color: theme.text }]}>Today's Plan</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onSearchPress}>
                    <Ionicons name="search" size={20} color={theme.textMuted} />
                    <Text style={[styles.searchText, { color: theme.textMuted }]}>Search Food</Text>
                </TouchableOpacity>
                {onMenuPress && (
                    <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
                        <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#121212',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        color: '#13ec5b',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    title: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    searchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1e',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchText: {
        color: '#d1d5db',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    menuBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

