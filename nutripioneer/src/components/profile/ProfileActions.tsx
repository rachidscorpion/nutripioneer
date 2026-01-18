'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { RefreshCw, Trash2, UserX } from 'lucide-react';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { toast } from 'sonner';

export default function ProfileActions() {
    const router = useRouter();
    const [action, setAction] = useState<'regenerate' | 'deleteRecipes' | 'deleteAccount' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        if (!action) return;

        setIsLoading(true);
        try {
            if (action === 'regenerate') {
                await api.recipes.regenerateAll();
                toast.success('Recipes regenerated successfully');
            } else if (action === 'deleteRecipes') {
                await api.recipes.deleteAll();
                toast.success('All recipes deleted');
            } else if (action === 'deleteAccount') {
                await api.user.deleteTestUser();
                toast.success('Account deleted');
                router.push('/onboarding'); // Redirect to onboarding
                return; // Don't refresh if we are leaving
            }
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Action failed. Please try again.');
        } finally {
            setIsLoading(false);
            setAction(null);
        }
    };

    const getModalProps = () => {
        switch (action) {
            case 'regenerate':
                return {
                    title: 'Regenerate All Recipes',
                    message: 'Are you sure you want to regenerate all recipes? This will replace your current recipe collection with new ones based on your profile.',
                    isDanger: false,
                    confirmText: 'Regenerate'
                };
            case 'deleteRecipes':
                return {
                    title: 'Delete All Recipes',
                    message: 'Are you sure you want to delete all recipes? This action cannot be undone.',
                    isDanger: true,
                    confirmText: 'Delete All'
                };
            case 'deleteAccount':
                return {
                    title: 'Delete Account',
                    message: 'Are you sure you want to delete your account? All your data including profile, plans, and recipes will be permanently removed. This action cannot be undone.',
                    isDanger: true,
                    confirmText: 'Delete Account'
                };
            default:
                return { title: '', message: '' };
        }
    };

    const modalProps = getModalProps();

    return (
        <div style={{
            marginTop: '2rem',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '2rem',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
        }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>
                Danger Zone
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                    onClick={() => setAction('regenerate')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
                >
                    <RefreshCw size={18} />
                    Regenerate All Recipes
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        onClick={() => setAction('deleteRecipes')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
                    >
                        <Trash2 size={18} />
                        Delete Recipes
                    </button>

                    <button
                        onClick={() => setAction('deleteAccount')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            background: '#ef4444',
                            border: '1px solid #dc2626',
                            color: 'white',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                    >
                        <UserX size={18} />
                        Delete Account
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!action}
                onClose={() => setAction(null)}
                onConfirm={handleConfirm}
                title={modalProps.title}
                message={modalProps.message}
                confirmText={modalProps.confirmText}
                isDanger={modalProps.isDanger}
                isLoading={isLoading}
            />
        </div>
    );
}
