import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" color={theme.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            >
                <Text style={[styles.lastUpdated, { color: theme.textMuted }]}>Last Updated: March 17, 2026</Text>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Introduction</Text>
                    <Text style={[styles.text, { color: theme.textMuted }]}>
                        Welcome to NutriPioneer. We are committed to protecting your personal information and your right to privacy.
                        This Privacy Policy explains what information we collect, how we use it, and your rights concerning your data.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Information We Collect</Text>
                    <Text style={[styles.text, { color: theme.textMuted }]}>
                        We collect personal information that you voluntarily provide to us, including:
                    </Text>
                    <View style={styles.list}>
                        <Text style={[styles.listItem, { color: theme.textMuted }]}>• Account information (name, email address)</Text>
                        <Text style={[styles.listItem, { color: theme.textMuted }]}>• Health and biometric data (age, weight, height, medical conditions, medications)</Text>
                        <Text style={[styles.listItem, { color: theme.textMuted }]}>• Dietary preferences and restrictions</Text>
                        <Text style={[styles.listItem, { color: theme.textMuted }]}>• Usage data and meal planning choices</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>3. How We Use Your Information</Text>
                    <Text style={[styles.text, { color: theme.textMuted }]}>
                        Your information is specifically utilized to provide context-aware, medically safe nutrition advice. We use your data to:
                    </Text>
                    <View style={styles.list}>
                        <Text style={[styles.listItem, { color: theme.textMuted }]}>• Generate personalized meal plans through AI</Text>
                        <Text style={[styles.listItem, { color: theme.textMuted }]}>• Identify potential nutrient-drug interactions</Text>
                        <Text style={[styles.listItem, { color: theme.textMuted }]}>• Improve our algorithms and conflict engine accuracy</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Data Sharing and Third Parties</Text>
                    <Text style={[styles.text, { color: theme.textMuted }]}>
                        We may share anonymous, aggregate data with our nutrition APIs for recipe retrieval.
                        However, your personally identifiable medical profiles remain strictly contained within our secure database.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Your Rights</Text>
                    <Text style={[styles.text, { color: theme.textMuted }]}>
                        You have the right to access, update, or delete your personal information at any time. You can manage these settings
                        directly from your Profile or contact our support team.
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
        marginBottom: 8,
    },
    list: {
        marginTop: 8,
        paddingLeft: 4,
    },
    listItem: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 6,
    }
});
