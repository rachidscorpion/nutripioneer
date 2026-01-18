
import { requireAuth, fetchWithAuth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import ProfileEditor from '@/components/profile/ProfileEditor';
import ProfileActions from '@/components/profile/ProfileActions';
import LogoutButton from '@/components/profile/LogoutButton';
import { OnboardingData } from '@/types/user';
import styles from '@/styles/Profile.module.css';

export default async function ProfilePage() {
    const session = await requireAuth();

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
            <LogoutButton />
        </main>
    );
}
