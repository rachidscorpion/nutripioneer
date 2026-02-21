import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome Home</Text>
                <Text style={styles.subtitle}>Your personalized meal plans will appear here.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#d1d5db',
        textAlign: 'center',
    }
});
