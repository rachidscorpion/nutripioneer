import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchSubscriptionProducts, purchaseSubscription, restorePurchases } from '../../lib/iap';
import type { Product } from 'react-native-iap';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

/**
 * SubscribeButton — triggers the iOS In-App Purchase flow.
 * Falls back to a "Contact Support" prompt when IAP products aren't available
 * (e.g. running in the simulator without StoreKit configuration).
 */
export default function SubscribeButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [priceLabel, setPriceLabel] = useState('Upgrade to Pro');
    const { restoreSession } = useAuth();
    const navigation = useNavigation<any>();

    useEffect(() => {
        (async () => {
            const products = await fetchSubscriptionProducts();
            if (products.length > 0) {
                // Pick the first (monthly) subscription
                const sub = products[0];
                setProduct(sub);
                if (sub.displayPrice) {
                    setPriceLabel(`Subscribe — ${sub.displayPrice}/mo`);
                }
            }
        })();
    }, []);

    const handlePurchase = async () => {
        if (!product) {
            Alert.alert(
                'Subscription Unavailable',
                'In-app purchases are not available right now. Please try again later.'
            );
            return;
        }
        setIsLoading(true);
        try {
            const success = await purchaseSubscription(product.id);
            if (success) {
                await restoreSession();
                Alert.alert('Success', 'Welcome to Nutri Pioneer PRO!');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsLoading(true);
        try {
            const restored = await restorePurchases();
            if (restored) {
                await restoreSession();
                Alert.alert('Success', 'Your subscription has been restored!');
            } else {
                Alert.alert('No Purchases Found', 'We could not find a previous subscription on this Apple ID.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={handlePurchase}
                disabled={isLoading}
                activeOpacity={0.8}
            >
                {isLoading ? (
                    <ActivityIndicator color="#000" size="small" />
                ) : (
                    <Ionicons name="diamond-outline" size={18} color="#000" />
                )}
                <Text style={styles.buttonText}>
                    {isLoading ? 'Processing…' : priceLabel}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.restoreBtn}
                onPress={handleRestore}
                disabled={isLoading}
            >
                <Text style={styles.restoreText}>Restore Purchase</Text>
            </TouchableOpacity>

            {product && (
                <View style={styles.disclaimerContainer}>
                    <Text style={styles.disclaimerTitle}>
                        Subscription: {Platform.OS === 'ios' ? 'PRO MONTHLY' : (product.title || 'Nutri Pioneer PRO')} (1 Month)
                    </Text>
                    <Text style={styles.disclaimerText}>
                        Price: {(product as any).localizedPrice || (product as any).price} / month
                    </Text>
                    <Text style={styles.disclaimerText}>
                        Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
                    </Text>
                    <View style={styles.linksContainer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Terms')} style={styles.linkTouch}>
                            <Text style={styles.linkText}>Terms of Use (EULA)</Text>
                        </TouchableOpacity>
                        <Text style={styles.linkSeparator}> • </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Privacy')} style={styles.linkTouch}>
                            <Text style={styles.linkText}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#13ec5b',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 16,
        width: '100%',
        maxWidth: 360,
        gap: 8,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    restoreBtn: {
        marginTop: 12,
        paddingVertical: 6,
    },
    restoreText: {
        color: '#64748b',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    disclaimerContainer: {
        marginTop: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    disclaimerTitle: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    disclaimerText: {
        color: '#64748b',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 6,
    },
    linksContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        flexWrap: 'wrap',
    },
    linkTouch: {
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    linkText: {
        color: '#13ec5b',
        fontSize: 11,
        textDecorationLine: 'underline',
    },
    linkSeparator: {
        color: '#64748b',
        fontSize: 11,
        marginHorizontal: 4,
    },
});
