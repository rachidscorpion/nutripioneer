'use client';

import { useState } from 'react';
import { createCustomerPortalSession } from '@/actions/polar';
import { Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ManageSubscriptionButtonProps {
    customerId: string;
    className?: string; // Allow custom styling from parent
}

export default function ManageSubscriptionButton({ customerId, className }: ManageSubscriptionButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleManageClick = async () => {
        setIsLoading(true);
        try {
            await createCustomerPortalSession(customerId);
        } catch (error) {
            console.error(error);
            toast.error("Failed to open subscription management. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleManageClick}
            disabled={isLoading}
            className={className}
            type="button"
        >
            {isLoading ? (
                <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Loading...
                </>
            ) : (
                <>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Subscription
                </>
            )}
        </button>
    );
}
