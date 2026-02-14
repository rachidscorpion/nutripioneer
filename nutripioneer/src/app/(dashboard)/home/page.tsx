
import { requireAuth, fetchWithAuth } from '@/lib/server-auth';
import TimelineFeed from './TimelineFeed';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { redirect } from 'next/navigation';

export default async function HomePage() {
    const session = await requireAuth();

    let userProfile;
    let conditions: string[] = [];
    try {
        const profileData = await fetchWithAuth('/users/profile');
        if (profileData && profileData.data) {
            userProfile = profileData.data;
            if (userProfile.conditions) {
                try {
                    conditions = typeof userProfile.conditions === 'string'
                        ? JSON.parse(userProfile.conditions)
                        : userProfile.conditions;
                } catch (e) {
                    // Fallback if parsing fails, assume empty or raw string
                    conditions = [];
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch profile", e);
    }

    let nutritionLimits = null;
    if (userProfile && userProfile.nutritionLimits) {
        try {
            nutritionLimits = typeof userProfile.nutritionLimits === 'string'
                ? JSON.parse(userProfile.nutritionLimits)
                : userProfile.nutritionLimits;
        } catch (e) {
            console.error("Failed to parse nutrition limits", e);
        }
    }

    const today = new Date();
    const dateStr = today.toISOString();

    let plan;
    try {
        const planRes = await fetchWithAuth(`/plans/daily?date=${dateStr}`);
        if (planRes && planRes.data) {
            plan = planRes.data;
        }
    } catch (e) {
        console.error("No plan found or error fetching", e);
    }

    if (!plan) {
        redirect('/plan');
    }

    const isPro = userProfile?.subscriptionStatus === 'active';

    return (
        <main className="min-h-screen bg-slate-50/50 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* <InteractiveBackground /> */}
            </div>

            <DashboardHeader conditions={conditions} planId={plan?.id} isPro={isPro} />

            {plan && <TimelineFeed plan={plan} nutritionLimits={nutritionLimits} />}
        </main>
    );
}
