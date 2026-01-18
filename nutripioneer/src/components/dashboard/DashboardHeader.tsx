'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import FoodCheckModal from '@/components/modals/FoodCheckModal';

interface DashboardHeaderProps {
    conditions: string[];
    planId?: string;
}

export default function DashboardHeader({ conditions, planId }: DashboardHeaderProps) {
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);

    return (
        <header className="dashboard-header">
            <div className="dashboard-header-top">
                <div>
                    <p className="date-text">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <h1 className="page-title">Today's Plan</h1>
                </div>

            </div>

            <button
                onClick={() => setIsFoodModalOpen(true)}
                className="search-btn"
            >
                <Search size={20} />
                <span className="search-text">Search Food</span>
            </button>

            <FoodCheckModal
                isOpen={isFoodModalOpen}
                onClose={() => setIsFoodModalOpen(false)}
                conditions={conditions}
                planId={planId}
            />
        </header>
    );
}
