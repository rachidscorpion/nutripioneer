'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin-auth';
import { Menu, X, LayoutDashboard, BarChart3, Database, LogOut } from 'lucide-react';
import Link from 'next/link';
import styles from '@/styles/Admin.module.css';

const NAV_ITEMS = [
    {
        section: 'Main',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        ],
    },
    {
        section: 'Analytics',
        items: [
            { id: 'overview', label: 'Overview', icon: BarChart3, path: '/admin/analytics/overview' },
            { id: 'users', label: 'Users', icon: BarChart3, path: '/admin/analytics/users' },
            { id: 'content', label: 'Content', icon: BarChart3, path: '/admin/analytics/content' },
            { id: 'system', label: 'System', icon: BarChart3, path: '/admin/analytics/system' },
        ],
    },
    {
        section: 'Database',
        items: [
            { id: 'models', label: 'Models', icon: Database, path: '/admin/database' },
            { id: 'sql', label: 'SQL Query', icon: Database, path: '/admin/database/sql' },
        ],
    },
];

function AdminSidebarAndLayout({
    children,
    pathname,
    isAuthenticated,
    isLoading,
    logout,
    email,
}: {
    children: React.ReactNode;
    pathname: string;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
    email: string | null;
}) {
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated && pathname !== '/admin/login') {
            router.push('/admin/login');
        }
    }, [isAuthenticated, isLoading, router, pathname]);

    const handleLogout = () => {
        logout();
        window.location.href = '/admin/login';
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const toggleMobileSidebar = () => {
        setMobileSidebarOpen(!mobileSidebarOpen);
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={`${styles.adminLayout} ${sidebarCollapsed ? styles.adminMainCollapsed : ''}`}>
            {/* Sidebar */}
            <div
                className={`${styles.adminSidebar} ${sidebarCollapsed ? styles.adminSidebarCollapsed : ''} ${mobileSidebarOpen ? styles.adminSidebarOpen : ''}`}
            >
                <div className={styles.adminSidebarHeader}>
                    <h1>Admin Panel</h1>
                </div>

                <nav className={styles.adminSidebarNav}>
                    {NAV_ITEMS.map((section) => (
                        <div key={section.section} className={styles.navSection}>
                            <div className={styles.navSectionTitle}>
                                {section.section}
                            </div>
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.path}
                                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                        onClick={() => setMobileSidebarOpen(false)}
                                    >
                                        <Icon className={styles.navItemIcon} />
                                        <span className={styles.navItemLabel}>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className={styles.adminSidebarFooter}>
                    <div style={{ padding: '0.5rem 0' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                            Signed in as
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {email || 'Admin'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`${styles.adminMain} ${sidebarCollapsed ? styles.adminMainCollapsed : ''}`}>
                {/* Header */}
                <div className={styles.adminHeader}>
                    <div className={styles.adminHeaderLeft}>
                        <button
                            className={styles.toggleButton}
                            onClick={toggleSidebar}
                            aria-label="Toggle sidebar"
                        >
                            {sidebarCollapsed ? <Menu size={20} /> : <Menu size={20} />}
                        </button>
                        <button
                            className={styles.toggleButton}
                            onClick={toggleMobileSidebar}
                            aria-label="Toggle mobile sidebar"
                            style={{ display: 'none' }}
                        >
                            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    <div className={styles.adminHeaderRight}>
                        <div className={styles.adminInfo}>
                            <span className={styles.adminEmail}>{email || 'Admin'}</span>
                        </div>
                        <button
                            className={styles.logoutButton}
                            onClick={handleLogout}
                        >
                            <LogOut size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <div className={styles.adminContent}>
                    {children}
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileSidebarOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 45,
                        display: 'none',
                    }}
                    onClick={toggleMobileSidebar}
                />
            )}
        </div>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { isAuthenticated, isLoading, logout, email } = useAdminAuth();

    // Don't wrap login page with admin layout - return children directly
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // For all other pages, use the admin layout with sidebar
    return (
        <AdminSidebarAndLayout
            pathname={pathname}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            logout={logout}
            email={email}
        >
            {children}
        </AdminSidebarAndLayout>
    );
}
