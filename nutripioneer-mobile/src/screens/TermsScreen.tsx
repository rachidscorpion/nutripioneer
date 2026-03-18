import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" color={theme.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Terms & Conditions</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            >
                <Text style={[styles.lastUpdated, { color: theme.textMuted }]}>Last Updated: March 17, 2026</Text>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Acceptance of Terms</Text>
                    <Text style={[styles.text, { color: theme.textMuted }]}>
                        By accessing and using NutriPioneer, you agree to be bound by these Terms and Conditions. 
                        If you disagree with any part of these terms, you may not use our service.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Medical Disclaimer</Text>
                    <Text style={[styles.text, { color: theme.textMuted, fontWeight: 'bold' }]}>
                        NutriPioneer is not a substitute for professional medical advice, diagnosis, or treatment.
                    </Text>
                    <Text style={[styles.text, { color: theme.textMuted, marginTop: 8 }]}>
                        Always seek the advice of your physician or other qualified health provider with any questions you may have 
                        regarding a medical condition, diet planning, or potential drug interactions.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>3. User Accounts</Text>
                    <Text style={[styles.text, { color: theme.textMuted }]}>
                        When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
                        You are responsible for safeguarding the password that you use to access the Service.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Subscriptions</Text>
                    <Text style={[styles.text, { color: theme.textMuted }]}>
                        Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and 
                        periodic basis. Your subscription will automatically renew under the exact same conditions unless cancelled.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Limitation of Liability</Text>
                    <Text style={[styles.text, { color: theme.textMuted }]}>
                        In no event shall NutriPioneer be liable for any indirect, incidental, special, consequential or punitive damages, 
                        resulting from your access to or use of or inability to access or use the Service, particularly relating to 
                        dietary adherence or medical outcomes.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 24,
    },
    lastUpdated: {
        fontSize: 13,
        marginBottom: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    text: {
        fontSize: 15,
        lineHeight: 24,
    }
});
