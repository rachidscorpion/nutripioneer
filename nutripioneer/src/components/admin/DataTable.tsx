'use client';

import { useState } from 'react';
import styles from '@/styles/Admin.module.css';
import { ChevronUp, ChevronDown, Search, Edit, Trash2 } from 'lucide-react';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    onPageChange?: (page: number) => void;
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortOrder?: 'asc' | 'desc';
    onSearch?: (query: string) => void;
    onEdit?: (row: any) => void;
    onDelete?: (row: any) => void;
    isLoading?: boolean;
}

export default function DataTable({
    columns,
    data,
    pagination,
    onPageChange,
    onSort,
    sortColumn,
    sortOrder,
    onSearch,
    onEdit,
    onDelete,
    isLoading,
}: DataTableProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (onSearch) {
            onSearch(value);
        }
    };

    const renderSortIcon = (column: string) => {
        if (sortColumn !== column) return null;
        return sortOrder === 'asc' ? (
            <ChevronUp size={14} style={{ display: 'inline', marginLeft: '0.25rem' }} />
        ) : (
            <ChevronDown size={14} style={{ display: 'inline', marginLeft: '0.25rem' }} />
        );
    };

    const renderCellValue = (column: Column, row: any) => {
        const value = row[column.key];
        if (column.render) {
            return column.render(value, row);
        }

        // Handle different value types
        if (value === null || value === undefined) {
            return <span style={{ color: 'var(--admin-text-secondary)', fontStyle: 'italic' }}>null</span>;
        }

        if (typeof value === 'boolean') {
            return (
                <span className={`${styles.badge} ${value ? styles.badgeSuccess : styles.badgeWarning}`}>
                    {value.toString()}
                </span>
            );
        }

        if (typeof value === 'object') {
            return <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{JSON.stringify(value)}</span>;
        }

        if (typeof value === 'string' && value.length > 50) {
            return <span title={value}>{value.substring(0, 50)}...</span>;
        }

        return value;
    };

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
                <h3 className={styles.tableTitle}>Records</h3>
                <div className={styles.tableActions}>
                    {onSearch && (
                        <div style={{ position: 'relative' }}>
                            <Search
                                size={16}
                                style={{
                                    position: 'absolute',
                                    left: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--admin-text-secondary)',
                                }}
                            />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                </div>
            ) : data.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateText}>No records found</div>
                </div>
            ) : (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            className={column.sortable ? styles.sortable : ''}
                                            onClick={() => column.sortable && onSort && onSort(column.key)}
                                        >
                                            {column.label}
                                            {column.sortable && renderSortIcon(column.key)}
                                        </th>
                                    ))}
                                    {(onEdit || onDelete) && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, index) => (
                                    <tr key={row.id || index}>
                                        {columns.map((column) => (
                                            <td key={column.key}>{renderCellValue(column, row)}</td>
                                        ))}
                                        {(onEdit || onDelete) && (
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {onEdit && (
                                                        <button
                                                            className={`${styles.button} ${styles.buttonSecondary}`}
                                                            onClick={() => onEdit(row)}
                                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            className={`${styles.button} ${styles.buttonDanger}`}
                                                            onClick={() => onDelete(row)}
                                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && onPageChange && (
                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} records
                            </div>
                            <div className={styles.paginationControls}>
                                <button
                                    className={styles.paginationButton}
                                    onClick={() => onPageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    Previous
                                </button>
                                <span style={{ padding: '0.5rem', color: 'var(--admin-text-secondary)' }}>
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    className={styles.paginationButton}
                                    onClick={() => onPageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
