import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutCard() {
    return (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Ionicons name="barbell" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>Daily Movement</Text>
                <Text style={styles.description}>Stay active for at least 30 minutes today.</Text>
            </View>
            <TouchableOpacity style={styles.btnIcon}>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1e',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2a2a2a',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        color: '#9ca3af',
        fontSize: 13,
    },
    btnIcon: {
        padding: 8,
    }
});
