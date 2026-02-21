import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Platform,
    ImageBackground,
    Image,
    StatusBar,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { api, setAuthToken } from '../lib/api-client';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        GoogleSignin.configure({
            iosClientId: '260830587028-q0nfq6efvl8fh6s0lvdbqq2v25q3lr3g.apps.googleusercontent.com',
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
            offlineAccess: true,
        });
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);

            if (Platform.OS === 'android') {
                await GoogleSignin.hasPlayServices();
            }

            const signInResult = await GoogleSignin.signIn();
            const idToken = signInResult.data?.idToken;

            if (!idToken) {
                Alert.alert('Error', 'Failed to get Google ID token. Please try again.');
                return;
            }

            const response = await api.auth.signInWithGoogle(idToken);


            if (response.data?.token) {
                await setAuthToken(response.data.token);
            }

            Alert.alert('Success', 'Signed in successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('Home' as never),
                },
            ]);
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                Alert.alert('Cancelled', 'Sign-in was cancelled');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('In Progress', 'Sign-in is already in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Google Play Services not available');
            } else {
                console.error('Google Sign-In Error:', error);
                Alert.alert('Error', error.response?.data?.message || 'Sign-in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1080&auto=format&fit=crop' }}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.overlay}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.container}>
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Image
                                    source={require('../../assets/icon.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                                <Text style={styles.title}>NutriPioneer</Text>
                                <Text style={styles.subtitle}>Your personalized nutrition app</Text>
                            </View>

                            <View style={styles.formContainer}>
                                <TouchableOpacity
                                    style={[styles.googleButton, loading && styles.buttonDisabled]}
                                    onPress={handleGoogleSignIn}
                                    disabled={loading}
                                >
                                    <Ionicons name="logo-google" size={24} color="#000" style={styles.googleIcon} />
                                    <Text style={styles.googleButtonText}>
                                        {loading ? 'Continuing...' : 'Continue with Google'}
                                    </Text>
                                </TouchableOpacity>

                                <Text style={styles.disclaimerText}>
                                    By continuing, you agree to our Terms of Service and Privacy Policy.
                                </Text>
                            </View>

                            {/* Empty view for spacing */}
                            <View style={{ flex: 1 }} />
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    header: {
        alignItems: 'center',
        marginTop: Platform.OS === 'ios' ? 80 : 60,
        flex: 2,
        justifyContent: 'center',
    },
    logoImage: {
        width: 100,
        height: 100,
        marginBottom: 24,
        borderRadius: 25,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 18,
        color: '#d1d5db',
        fontWeight: '400',
    },
    formContainer: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#13ec5b', // Using brand color
        borderRadius: 12,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    googleIcon: {
        marginRight: 12,
    },
    googleButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    disclaimerText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
        lineHeight: 18,
    },
});
