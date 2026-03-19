import { Platform, Alert } from 'react-native';
import {
    initConnection,
    endConnection,
    fetchProducts,
    requestPurchase,
    getAvailablePurchases,
    finishTransaction,
    restorePurchases as restorePurchasesIAP,
    type Product,
    type Purchase,
    type PurchaseError,
} from 'react-native-iap';
import { api } from './api-client';

// Replace with your actual App Store Connect product IDs
const SUBSCRIPTION_SKUS = Platform.select({
    ios: ['PRO_1'],
    default: [] as string[],
}) as string[];

// Module-level state for IAP connection
let connectionPromise: Promise<void> | null = null;
let isConnected = false;

/**
 * Initialize the IAP connection.
 * Call this once when the app boots (e.g. in App.tsx or a context provider).
 * Stores the promise so other functions can await it.
 */
export async function initIAP(): Promise<void> {
    console.log('[IAP] initIAP() called, Platform:', Platform.OS);
    connectionPromise = (async () => {
        try {
            const result = await initConnection();
            isConnected = true;
        } catch (err: any) {
            isConnected = false;
        }
    })();
    return connectionPromise;
}

/**
 * Wait for the IAP connection to be ready before making any store calls.
 * Returns true if the connection is available, false otherwise.
 */
async function ensureConnection(): Promise<boolean> {
    if (connectionPromise) {
        await connectionPromise;
    }
    return isConnected;
}

/**
 * Tear down IAP connection. Call on app unmount / logout.
 */
export function destroyIAP(): void {
    connectionPromise = null;
    isConnected = false;
    endConnection();
}

/**
 * Fetch available subscription products from the store.
 */
export async function fetchSubscriptionProducts(): Promise<Product[]> {
    console.log('[IAP] fetchSubscriptionProducts() called');
    const connected = await ensureConnection();
    console.log('[IAP] ensureConnection returned:', connected);

    if (!connected) {
        console.log('[IAP] skipping fetchProducts — no store connection');
        return [];
    }
    try {
        console.log('[IAP] calling react-native-iap fetchProducts with SKUs:', SUBSCRIPTION_SKUS);
        const products = await fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });
        console.log('[IAP] fetchProducts returned:', JSON.stringify(products, null, 2));
        return (products || []) as Product[];
    } catch (err: any) {
        console.error('[IAP] fetchProducts error:', err?.message || err);
        console.error('[IAP] fetchProducts error details:', JSON.stringify(err, null, 2));
        return [];
    }
}

/**
 * Initiate a subscription purchase for the given product ID.
 */
export async function purchaseSubscription(productId: string): Promise<void> {
    const connected = await ensureConnection();
    if (!connected) {
        Alert.alert(
            'Store Unavailable',
            'In-app purchases are not available in this environment. Please test on a real device or configure StoreKit in Xcode.'
        );
        return;
    }
    try {
        await requestPurchase({
            type: 'subs',
            request: {
                apple: { sku: productId },
            },
        });
    } catch (err: any) {
        const code = err?.code || err?.responseCode;
        if (code === 'E_USER_CANCELLED' || String(code) === '1') {
            console.log('[IAP] user cancelled');
        } else {
            console.error('[IAP] requestPurchase error:', err);
            Alert.alert('Purchase Failed', err.message || 'Could not complete purchase.');
        }
    }
}

/**
 * Validate the purchase on the backend and finish the transaction.
 */
export async function validateAndFinishPurchase(purchase: Purchase): Promise<void> {
    try {
        const token = purchase.purchaseToken || purchase.transactionId;
        if (token) {
            await api.user.validateReceipt({
                platform: 'ios',
                receipt: token,
                productId: purchase.productId,
            });
            console.log('[IAP] receipt validated on backend');
        }
        await finishTransaction({ purchase, isConsumable: false });
    } catch (err) {
        console.error('[IAP] validateAndFinishPurchase error:', err);
    }
}

/**
 * Restore previous purchases (e.g. after reinstall or new device).
 */
export async function restorePurchases(): Promise<boolean> {
    const connected = await ensureConnection();
    if (!connected) {
        Alert.alert(
            'Store Unavailable',
            'In-app purchases are not available in this environment. Please test on a real device.'
        );
        return false;
    }
    try {
        const purchases = await getAvailablePurchases();
        if (purchases.length > 0) {
            // Validate the most recent purchase on the backend
            const latest = purchases[purchases.length - 1];
            const token = latest.purchaseToken || latest.transactionId;
            await api.user.validateReceipt({
                platform: 'ios',
                receipt: token || '',
                productId: latest.productId,
            });
            return true;
        }
        return false;
    } catch (err) {
        console.error('[IAP] restorePurchases error:', err);
        return false;
    }
}

