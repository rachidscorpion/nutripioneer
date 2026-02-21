import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../../store/useOnboardingStore';

export default function WelcomeScreen() {
    const navigation = useNavigation();
    const { nextStep } = useOnboardingStore();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to Onboarding</Text>
                <Text style={styles.subtitle}>Step 1</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        // Normally nextStep(), but for now just go home directly for demo
                        navigation.navigate('Home' as never);
                    }}
                >
                    <Text style={styles.buttonText}>Continue (Demo)</Text>
                </TouchableOpacity>
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
        color: '#13ec5b',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#13ec5b',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
