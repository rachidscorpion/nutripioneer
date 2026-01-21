import { format } from 'date-fns';
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

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const targetDateStr = dateParam || todayStr;

    // Use UTC date for API consistency server-side
    const apiDate = new Date(targetDateStr);
    const dateStr = apiDate.toISOString();

    // Fetch plan
    let plan = null;

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
        dateString={targetDateStr}
        isOwner={true} // In dashboard we are always owner
    />;
}
