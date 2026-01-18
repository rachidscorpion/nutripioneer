'use client';

import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function DeleteTestUserBtn() {
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete tahaharbour@gmail.com?')) {
            try {
                await api.user.deleteTestUser();
                alert('User deleted');
                window.location.href = '/';
            } catch (e) {
                alert('Failed to delete user');
            }
        }
    };

    return (
        <button
            onClick={handleDelete}
            style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                zIndex: 9999,
                background: 'red',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px'
            }}
        >
            Delete Test User
        </button>
    );
}
