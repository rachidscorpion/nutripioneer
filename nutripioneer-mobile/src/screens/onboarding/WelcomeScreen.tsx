import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
    const navigation = useNavigation();
    const { name, email, updateData, nextStep } = useOnboardingStore();

    const [localName, setLocalName] = useState(name || '');
    const [localEmail, setLocalEmail] = useState(email || '');

    const handleNext = () => {
        updateData('name', localName);
        updateData('email', localEmail);
        nextStep();
        navigation.navigate('OnboardingConditions' as never);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1080&auto=format&fit=crop' }}
                style={styles.backgroundImage}
            >
                <View style={styles.overlay}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Welcome</Text>
                            <Text style={styles.subtitle}>Let's set up your personalized health profile.</Text>
                        </View>

                        <View style={styles.glassCard}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#13ec5b" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="First Name"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={localName}
                                    onChangeText={setLocalName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#13ec5b" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    value={localEmail}
                                    onChangeText={setLocalEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.button, (!localName || !localEmail) && styles.buttonDisabled]}
                                onPress={handleNext}
                                disabled={!localName || !localEmail}
                            >
                                <Text style={styles.buttonText}>Next</Text>
                                <Ionicons name="arrow-forward" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginTop: 40,
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#d1d5db',
        lineHeight: 24,
    },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.3)',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    button: {
        backgroundColor: '#13ec5b',
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
});
