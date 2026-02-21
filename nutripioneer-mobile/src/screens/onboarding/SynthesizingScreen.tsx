import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Platform,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api-client';
import { AxiosError } from 'axios';

type LogItem = {
    id: string;
    text: string;
    status: 'pending' | 'active' | 'complete';
};

export default function SynthesizingScreen() {
    const navigation = useNavigation();
    const store = useOnboardingStore();

    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<LogItem[]>([
        { id: '1', text: 'Analyzing Biometrics...', status: 'pending' },
        { id: '2', text: 'Configuring Dietary Filters...', status: 'pending' },
        { id: '3', text: 'Generating Nutrition Limits...', status: 'pending' },
        { id: '4', text: 'Finalizing Health Profile...', status: 'pending' },
    ]);

    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        let isNavigating = false;

        const runSimulationAndSubmit = async () => {
            // Start UI sequence
            const updateLogStatus = (index: number, status: 'pending' | 'active' | 'complete') => {
                setLogs(prev => {
                    const next = [...prev];
                    next[index].status = status;
                    return next;
                });
            };

            // Artificial delay to show off UI
            updateLogStatus(0, 'active');
            await new Promise(r => setTimeout(r, 1000));
            updateLogStatus(0, 'complete');
            setProgress(25);

            updateLogStatus(1, 'active');
            await new Promise(r => setTimeout(r, 1000));
            updateLogStatus(1, 'complete');
            setProgress(50);

            updateLogStatus(2, 'active');

            // Start real API submission
            let success = false;
            try {
                await api.user.updateProfile({
                    name: store.name || 'User',
                    email: store.email,
                    conditions: store.conditions,
                    biometrics: store.biometrics,
                    medical: store.medical,
                    dietary: store.dietary,
                });

                if (store.biometrics.weight && store.biometrics.age) {
                    try {
                        const limitsRes = await api.user.generateNutritionLimits();
                        if (limitsRes.data?.success && limitsRes.data?.data) {
                            await api.user.updateNutritionLimits(limitsRes.data.data);
                        }
                    } catch (err) {
                        console.error("AI Generation failed non-fatal", err);
                    }
                }

                await api.plans.generate(new Date().toISOString());
                success = true;
            } catch (error) {
                console.error("Onboarding API error:", error);
                if (error instanceof AxiosError && error.response?.status === 401) {
                    Alert.alert('Session Expired', 'Please log in again.');
                    await api.auth.logout().catch(() => { });
                    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
                    return;
                }
                Alert.alert('Error', 'Failed to save profile. Please try again or check your connection.');
            }

            updateLogStatus(2, 'complete');
            setProgress(75);

            updateLogStatus(3, 'active');
            await new Promise(r => setTimeout(r, 800));
            updateLogStatus(3, 'complete');
            setProgress(100);

            if (success && !isNavigating) {
                isNavigating = true;
                store.completeOnboarding();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' as never }],
                });
            }
        };

        runSimulationAndSubmit();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const reverseSpin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg']
    });

    return (
        <View style={styles.container}>
            <View style={styles.content}>

                <View style={styles.header}>
                    <Text style={styles.title}>AI Synthesis</Text>
                    <Text style={styles.subtitle}>Creating your personalized plan.</Text>
                </View>

                {/* Central Animation Sphere */}
                <View style={styles.sphereContainer}>
                    <View style={styles.glassSphere}>
                        <Animated.View style={[styles.glowRing, styles.glowRingOuter, { transform: [{ rotate: spin }] }]} />
                        <Animated.View style={[styles.glowRing, styles.glowRingInner, { transform: [{ rotate: reverseSpin }] }]} />
                        <View style={styles.centerCore}>
                            <Ionicons name="flash" size={48} color="#13ec5b" />
                        </View>
                    </View>
                </View>

                {/* Status Logs */}
                <View style={styles.logsContainer}>
                    {logs.map((log) => (
                        <View key={log.id} style={styles.logRow}>
                            <View style={styles.logIconContainer}>
                                {log.status === 'complete' ? (
                                    <Ionicons name="checkmark-circle" size={24} color="#13ec5b" />
                                ) : log.status === 'active' ? (
                                    <Ionicons name="sync-circle" size={24} color="#3b82f6" />
                                ) : (
                                    <Ionicons name="ellipse-outline" size={24} color="rgba(255,255,255,0.2)" />
                                )}
                            </View>
                            <Text style={[styles.logText, log.status !== 'pending' && styles.logTextActive]}>
                                {log.text}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 60,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
    },
    sphereContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    glassSphere: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        elevation: 10,
    },
    glowRing: {
        position: 'absolute',
        borderRadius: 150,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    glowRingOuter: {
        width: 200,
        height: 200,
        borderTopColor: 'rgba(19, 236, 91, 0.4)',
        borderRightColor: 'rgba(19, 236, 91, 0.1)',
        borderBottomColor: 'rgba(19, 236, 91, 0.4)',
        borderLeftColor: 'rgba(19, 236, 91, 0.1)',
    },
    glowRingInner: {
        width: 160,
        height: 160,
        borderTopColor: 'rgba(19, 236, 91, 0.1)',
        borderRightColor: 'rgba(19, 236, 91, 0.6)',
        borderBottomColor: 'rgba(19, 236, 91, 0.1)',
        borderLeftColor: 'rgba(19, 236, 91, 0.6)',
    },
    centerCore: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    logsContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 40,
    },
    logRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    logIconContainer: {
        width: 32,
        alignItems: 'center',
    },
    logText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
    logTextActive: {
        color: '#fff',
    },
    progressContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#13ec5b',
        borderRadius: 3,
    },
});
