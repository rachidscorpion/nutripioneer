import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RestaurantRescueScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Restaurant Rescue</Text>
            <Text style={styles.subtitle}>Scan menus to find safe meals.</Text>
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
