import { format } from 'date-fns';
import { requireAuth, fetchWithAuth } from '@/lib/server-auth';
import PlanView from '@/components/plan/PlanView';

export default async function PlanPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const session = await requireAuth();

    const resolvedParams = await searchParams;
    const dateParam = resolvedParams?.date;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const targetDateStr = dateParam || todayStr;

    // Use UTC date for API consistency server-side
    // Fix: Set to Noon UTC to ensure that when backend converts to local time, it remains the same day
    // (e.g. 00:00 UTC is 19:00 EST previous day, but 12:00 UTC is 07:00 EST same day)
    const apiDate = new Date(targetDateStr);
    apiDate.setUTCHours(12, 0, 0, 0);
    const dateStr = apiDate.toISOString();

    // Fetch plan and user profile
    let plan = null;
    let userProfile = null;

    try {
        // Use fetchWithAuth to ensure cookies are passed to backend
        const res = await fetchWithAuth(`/plans/daily?date=${dateStr}`, {
            method: 'GET',
        });
        if (res && res.success) {
            plan = res.data;
        }
    } catch (e) {
        console.error("Plan not found or error", e);
    }

    try {
        const profileRes = await fetchWithAuth('/users/profile');
        if (profileRes && profileRes.data) {
            userProfile = profileRes.data;
        }
    } catch (e) {
        console.error("Failed to fetch user profile", e);
    }

    const isPro = userProfile?.subscriptionStatus === 'active';

    // Pass necessary data to client
    return <PlanView
        plan={plan}
        dateString={targetDateStr}
        isOwner={true} // In dashboard we are always owner
        isPro={isPro}
    />;
}
