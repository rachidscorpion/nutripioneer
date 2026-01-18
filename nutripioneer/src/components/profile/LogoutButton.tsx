'use client';

import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import styles from '@/styles/Profile.module.css';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await api.auth.logout();
            router.push('/onboarding');
            router.refresh();
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
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
