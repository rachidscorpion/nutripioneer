'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api-client';

// Using inline styles for now to match project style, but organized.
const styles = {
    container: {
        position: 'fixed' as const,
        bottom: '10px',
        right: '140px',
        zIndex: 9999,
        display: 'flex',
        gap: '10px'
    },
    button: {
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    loadingOverlay: {
        position: 'fixed' as const,
        bottom: '10px',
        right: '150px',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px'
    }
};

const colors = {
    purple: '#9333ea',
    fuchsia: '#d946ef',
    blue: '#2563eb',
    red: '#ef4444'
};

export default function ManagePlanControls() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAction = async (
        confirmMsg: string,
        action: string,
        successMsg: string
    ) => {
        if (confirm(confirmMsg)) {
            setLoading(true);
            try {
                // Determine action
                const date = new Date().toISOString(); // Today for plan actions

                if (action === 'regenerateRecipes') {
                    await api.recipes.regenerateAll();
                } else if (action === 'deleteAllRecipes') {
                    await api.recipes.deleteAll();
                } else if (action === 'regenerateDailyPlan') {
                    await api.plans.generate(date);
                } else if (action === 'deleteDailyPlan') {
                    await api.plans.delete(date);
                }

                alert(successMsg);
                router.refresh();
            } catch (e: any) {
                alert('Error: ' + (e.message || 'Unknown error'));
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div style={styles.container}>
            <button
                onClick={() => handleAction(
                    'Regenerate all recipes? (This will delete current recipes and fetch new ones)',
                    'regenerateRecipes',
                    'Recipes regenerated'
                )}
                style={{ ...styles.button, background: colors.purple }}
            >
                Regens Recipes
            </button>

            <button
                onClick={() => handleAction(
                    'Delete all recipes?',
                    'deleteAllRecipes',
                    'Recipes deleted'
                )}
                style={{ ...styles.button, background: colors.fuchsia }}
            >
                Del Recipes
            </button>

            <button
                onClick={() => handleAction(
                    'Regenerate plan for today? (This replaces the current plan)',
                    'regenerateDailyPlan',
                    'Plan regenerated'
                )}
                style={{ ...styles.button, background: colors.blue }}
            >
                Regens Plan
            </button>

            <button
                onClick={() => handleAction(
                    'Are you sure you want to DELETE the plan for today?',
                    'deleteDailyPlan',
                    'Plan deleted'
                )}
                style={{ ...styles.button, background: colors.red }}
            >
                Delete Plan
            </button>
        </div>
    );
}
