'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';
import DataTable from '@/components/admin/DataTable';
import styles from '@/styles/Admin.module.css';
import { ArrowLeft, Edit, Trash2, Play } from 'lucide-react';

interface ModelListData {
    models: string[];
}

interface RecordData {
    data: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function DatabaseModelPage() {
    const router = useRouter();
    const params = useParams();
    const model = params.model as string;

    const [data, setData] = useState<RecordData | null>(null);
    const [columns, setColumns] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [sort, setSort] = useState('id');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (model) {
            loadData();
        }
    }, [model, page, limit, sort, order, search]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const response = await adminApi.db.list(model, page, limit, sort, order, search || undefined);
            if (response.data.success) {
                setData(response.data);

                // Extract columns from first row
                if (response.data.data && response.data.data.length > 0) {
                    const cols = Object.keys(response.data.data[0]);
                    setColumns(cols);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (column: string) => {
        if (sort === column) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setSort(column);
            setOrder('desc');
        }
        setPage(1);
    };

    const handleSearch = (query: string) => {
        setSearch(query);
        setPage(1);
    };

    const handleEdit = (row: any) => {
        router.push(`/admin/database/${model}/${row.id}`);
    };

    const handleDelete = async (row: any) => {
        if (!confirm(`Are you sure you want to delete this ${model} record?`)) {
            return;
        }

        try {
            await adminApi.db.delete(model, row.id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete record');
        }
    };

    const tableColumns = columns.map((col) => ({
        key: col,
        label: col,
        sortable: true,
        render: (value: any) => {
            // Special rendering for certain fields
            if (col === 'createdAt' || col === 'updatedAt') {
                return value ? new Date(value).toLocaleString() : null;
            }
            if (col.endsWith('Id') && typeof value === 'string' && value.length > 10) {
                return <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{value.substring(0, 10)}...</span>;
            }
            return value;
        },
    }));

    if (error) {
        return (
            <div>
                <div className={styles.pageHeader}>
                    <button
                        className={`${styles.button} ${styles.buttonSecondary}`}
                        onClick={() => router.push('/admin/database')}
                        style={{ marginBottom: '1rem' }}
                    >
                        <ArrowLeft size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Back to Models
                    </button>
                    <h1 className={styles.pageTitle}>{model}</h1>
                </div>
                <div className={`${styles.alert} ${styles.alertError}`}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <button
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={() => router.push('/admin/database')}
                    style={{ marginBottom: '1rem' }}
                >
                    <ArrowLeft size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Back to Models
                </button>
                <h1 className={styles.pageTitle}>{model}</h1>
                <p className={styles.pageDescription}>
                    Browse and manage {model} records
                </p>
            </div>

            {data && (
                <DataTable
                    columns={tableColumns}
                    data={data.data}
                    pagination={data.pagination}
                    onPageChange={setPage}
                    onSort={handleSort}
                    sortColumn={sort}
                    sortOrder={order}
                    onSearch={handleSearch}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
}
