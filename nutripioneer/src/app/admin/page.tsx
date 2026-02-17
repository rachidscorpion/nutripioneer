'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin-auth';

export default function AdminPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAdminAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.replace('/admin/dashboard');
            } else {
                router.replace('/admin/login');
            }
        }
    }, [isAuthenticated, isLoading, router]);

    return null;
}
