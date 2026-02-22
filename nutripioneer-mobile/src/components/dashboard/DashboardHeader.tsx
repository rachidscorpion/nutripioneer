import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DashboardHeaderProps {
    onSearchPress?: () => void;
}

export default function DashboardHeader({ onSearchPress }: DashboardHeaderProps) {
    const insets = useSafeAreaInsets();
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
            <View>
                <Text style={styles.dateText}>{dateString}</Text>
                <Text style={styles.title}>Today's Plan</Text>
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={onSearchPress}>
                <Ionicons name="search" size={20} color="#d1d5db" />
                <Text style={styles.searchText}>Search Food</Text>
            </TouchableOpacity>
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
    }
});
