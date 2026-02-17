
import { requireAuth, fetchWithAuth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProfileEditor from '@/components/profile/ProfileEditor';
import ProfileActions from '@/components/profile/ProfileActions';
import LogoutButton from '@/components/profile/LogoutButton';
import ManageSubscriptionButton from '@/components/profile/ManageSubscriptionButton';
import { OnboardingData } from '@/types/user';
import { ArrowRight, Send } from 'lucide-react';
import styles from '@/styles/Profile.module.css';

export default async function ProfilePage(props: { searchParams: Promise<{ success?: string }> }) {
    const session = await requireAuth();
    const searchParams = await props.searchParams;

    // Trigger sync if returning from checkout
    if (searchParams.success === 'true') {
        try {
            await fetchWithAuth('/users/profile/subscription/sync', { method: 'POST' });
        } catch (e) {
            console.error("Subscription sync failed", e);
        }
    }

    let user;
    try {
        const res = await fetchWithAuth('/users/profile');
        if (res && res.data) {
            user = res.data;
        }
    } catch (e) {
        // console.error("Failed to fetch profile", e);
    }

    if (!user) {
        redirect('/onboarding');
    }

    // Parse the JSON data safely
    let initialData: OnboardingData;
    try {
        // Depending on backend, onboardingData might be string or object.
        // Assuming string (if matching Prisma type).
        const raw = typeof user.onboardingData === 'string'
            ? JSON.parse(user.onboardingData)
            : (user.onboardingData || {});

        // Normalize seed data mismatch (height vs heightCm)
        if (raw.biometrics) {
            initialData = {
                ...raw,
                biometrics: {
                    ...raw.biometrics,
                    heightCm: raw.biometrics.heightCm || raw.biometrics.height || 165,
                    weightKg: raw.biometrics.weightKg || raw.biometrics.weight || 65,
                    waistCm: raw.biometrics.waistCm || raw.biometrics.waist || 70,
                }
            };
        } else {
            // If raw is empty or structured differently
            throw new Error("Invalid structure");
        }

    } catch (e) {
        // Fallback if parsing fails or data is missing
        initialData = {
            biometrics: { gender: 'female', heightCm: 165, weightKg: 65, waistCm: 70 },
            medical: { insulin: false, medications: [] },
            lifestyle: { activityLevel: 'moderate', sleepAvgHours: 7 },
            dietary: { favorites: [], dislikes: [], allergies: [] }
        };
    }

    return (
        <main className={styles.pageWrapper}>
            <ProfileEditor user={user} initialData={initialData} />
            <ProfileActions />

            {/* Subscription Link */}
            {user?.subscriptionStatus === 'active' && user?.polarCustomerId ? (
                <div className={styles.upgradeBanner} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <div className={styles.upgradeBannerContent}>
                        <span className={styles.upgradeBannerTitle}>Pro Member Active</span>
                        <span className={styles.upgradeBannerSubtitle}>Thanks for supporting NutriPioneer!</span>
                    </div>
                    {user?.polarCustomerId && (
                        <ManageSubscriptionButton
                            customerId={user.polarCustomerId}
                            className={styles.manageSubscriptionBtn}
                        />
                    )}
                </div>
            ) : (
                <Link href="/subscription" className={styles.upgradeBanner}>
                    <div className={styles.upgradeBannerContent}>
                        <span className={styles.upgradeBannerTitle}>Upgrade to Pro</span>
                        <span className={styles.upgradeBannerSubtitle}>Unlock premium features & AI insights</span>
                    </div>
                    <span className={styles.upgradeBannerArrow}>
                        <ArrowRight size={20} />
                    </span>
                </Link>
            )}

            <Link href="/feedback" className={styles.feedbackBtn}>
                <Send size={18} /> Submit Feedback
            </Link>

            <LogoutButton />
        </main>
    );
}
