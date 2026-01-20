"use client";

import { SubscribeButton } from "@/components/SubscribeButton";
import { Check, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import styles from "@/styles/Subscription.module.css";
import { useEffect, useState } from "react";

export default function SubscriptionPage() {
    const features = [
        "AI-Powered Meal Plans",
        "Unlimited Recipe Analysis",
        "Advanced Health Metrics Tracking",
        "Priority Support",
        "Exclusive Nutrition Content"
    ];

    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                const data = await response.json();
                setProducts(data.data);
                console.log(data);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        Upgrade to NutriPioneer Pro
                    </h1>
                    <p className={styles.subtitle}>
                        Unlock the full potential of your nutrition journey with advanced AI insights and personalized tracking.
                    </p>
                </header>

                <div className={styles.cardGrid}>
                    <div className={styles.pricingCard}>
                        <span className={styles.popularBadge}>POPULAR</span>

                        <div className={styles.cardContent}>
                            <h3 className={styles.planName}>Pro Monthly</h3>
                            <div className={styles.priceRow}>
                                <span className={styles.price}>$10</span>
                                <span className={styles.period}>/month</span>
                            </div>
                            <p className={styles.cancelNote}>
                                Cancel anytime. No hidden fees.
                            </p>

                            <ul className={styles.featuresList}>
                                {features.map((feature, i) => (
                                    <li key={i} className={styles.featureItem}>
                                        <Check className={styles.featureIcon} />
                                        <span className={styles.featureText}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <SubscribeButton />

                            <p className={styles.securityNote}>
                                <Shield className={styles.securityIcon} />
                                Secure payment via Polar.sh
                            </p>
                        </div>
                    </div>
                </div>

                <Link href="/profile" className={styles.backLink}>
                    <ArrowLeft size={16} />
                    Back to Profile
                </Link>
            </div>
        </div>
    );
}
