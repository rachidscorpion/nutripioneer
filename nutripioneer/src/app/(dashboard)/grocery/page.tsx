import { requireAuth, fetchWithAuth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import GroceryListClient from '@/components/grocery/GroceryListClient';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default async function GroceryPage() {
    const session = await requireAuth();

    let items = [];
    try {
        const res = await fetchWithAuth('/grocery');
        items = (res && res.data) || [];
    } catch (e) {
        console.error("Failed to fetch grocery list", e);
    }

    let conditions: string[] = [];
    try {
        const profileRes = await fetchWithAuth('/users/profile');
        const user = profileRes?.data;
        if (user?.conditions) {
            conditions = typeof user.conditions === 'string'
                ? JSON.parse(user.conditions)
                : user.conditions;
        }
    } catch (e) {
        console.error("Failed to fetch profile", e);
    }

    return (
        <main className="min-h-screen bg-white pb-20">
            <DashboardHeader conditions={conditions} />
            <div className="pt-8">
                <GroceryListClient initialItems={items} />
            </div>
        </main>
    );
}
