'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { RefreshCw, Trash2, UserX } from 'lucide-react';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { toast } from 'sonner';
import styles from '@/styles/Profile.module.css';

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
                await api.user.deleteAccount();
                await api.auth.logout();
                toast.success('Account deleted');
                window.location.href = '/onboarding';
                return;
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
        <div className={styles.actionsContainer}>
            <h3 className={styles.dangerZoneTitle}>
                Danger Zone
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                    onClick={() => setAction('regenerate')}
                    className={styles.actionBtn}
                >
                    <RefreshCw size={18} />
                    Regenerate All Recipes
                </button>

                <div className={styles.dangerGrid}>
                    <button
                        onClick={() => setAction('deleteRecipes')}
                        className={styles.dangerBtnSoft}
                    >
                        <Trash2 size={18} />
                        Delete Recipes
                    </button>

                    <button
                        onClick={() => setAction('deleteAccount')}
                        className={styles.dangerBtnSolid}
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
