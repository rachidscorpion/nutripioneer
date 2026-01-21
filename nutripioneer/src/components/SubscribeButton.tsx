"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import styles from "@/styles/Subscription.module.css";

interface SubscribeButtonProps {
    productId?: string;
    className?: string;
}

export function SubscribeButton({ productId, className }: SubscribeButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    // If no productId provided via props, try env or default
    const effectiveProductId = productId || process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID;

    const handleSubscribe = async () => {
        if (!effectiveProductId) {
            toast.error("Product ID not configured");
            return;
        }

        try {
            setIsLoading(true);

            // Call the backend checkout endpoint (proxied via Next.js)
            // Path: /api/auth/polar/checkout based on Better Auth plugin convention
            const response = await fetch("/api/auth/polar/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    products: effectiveProductId,
                    successUrl: window.location.origin + "/dashboard?success=true",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || "Failed to create checkout");
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error("Failed to start subscription");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={`${styles.subscribeBtn} ${className || ""}`}
        >
            {isLoading && <Loader2 className={styles.spinner} />}
            {isLoading ? "Processing..." : "Subscribe with Polar"}
        </button>
    );
}
