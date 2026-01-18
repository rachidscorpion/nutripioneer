
import { requireAuth, fetchWithAuth } from '@/lib/server-auth';
// import { api } from '@/lib/api-client'; // Not needed for server-side fetch here anymore if we replace all uses
import PlanView from '@/components/plan/PlanView';

export default async function PlanPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const session = await requireAuth();

    const resolvedParams = await searchParams;
    const dateParam = resolvedParams?.date;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetDate = today;
    if (dateParam) {
        // Simple validation
        const parsed = new Date(dateParam);
        if (!isNaN(parsed.getTime())) {
            targetDate = parsed;
            // Normalize to midnight local time conceptually, but be careful with timezones.
            // Using ISO string YYYY-MM-DD from client is safest.
            // But here we rely on the Date constructor. 
            // Better to align timezone handling. 
            // For now, simple split if YYYY-MM-DD format:
            if (dateParam.includes('-')) {
                const parts = dateParam.split('-');
                targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
        }
    }
    targetDate.setHours(0, 0, 0, 0);

    // Fetch plan
    let plan = null;
    const dateStr = targetDate.toISOString();

    try {
        // Use fetchWithAuth to ensure cookies are passed to the backend
        const res = await fetchWithAuth(`/plans/daily?date=${dateStr}`, {
            method: 'GET',
        });
        if (res && res.success) {
            plan = res.data;
        }
    } catch (e) {
        console.error("Plan not found or error", e);
    }

    // Pass necessary data to client
    return <PlanView
        plan={plan}
        date={targetDate}
        isOwner={true} // In dashboard we are always owner
    />;
}
