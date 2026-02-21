import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PlanScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Meal Plan</Text>
            <Text style={styles.subtitle}>Your personalized meal plans will appear here.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#a1a1aa',
    },
});
