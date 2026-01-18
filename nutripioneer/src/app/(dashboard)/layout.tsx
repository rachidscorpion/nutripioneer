import FloatingDock from '@/components/ui/FloatingDock';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen relative">
            <FloatingDock />
            {children}
        </div>
    );
}
