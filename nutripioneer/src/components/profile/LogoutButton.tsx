'use client';

import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import styles from '@/styles/Profile.module.css';
import { useOnboardingStore } from '@/store/useOnboardingStore';

export default function LogoutButton() {
    const router = useRouter();
    const { reset } = useOnboardingStore();

    const handleLogout = async () => {
        try {
            await api.auth.logout();
            reset();
            window.location.href = '/onboarding';
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', paddingBottom: '10rem' }}>
            <button
                onClick={handleLogout}
                className={styles.logoutBtn}
                style={{ marginLeft: 0 }} // Override margin-left: auto from the class
            >
                <LogOut size={18} />
                Sign Out
            </button>
        </div>
    );
}
