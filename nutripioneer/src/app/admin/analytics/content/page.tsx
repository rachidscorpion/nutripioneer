'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import styles from '@/styles/Admin.module.css';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface MealCompletionData {
    breakfast: Record<string, number>;
    lunch: Record<string, number>;
    dinner: Record<string, number>;
    totalPlans: number;
}

interface RecipeData {
    id: string;
    name: string;
    image: string | null;
    planCount: number;
    saveCount: number;
}

const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ContentAnalyticsPage() {
    const [mealData, setMealData] = useState<MealCompletionData | null>(null);
    const [recipes, setRecipes] = useState<RecipeData[]>([]);
    const [recipeLimit, setRecipeLimit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [recipeLimit]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [mealsRes, recipesRes] = await Promise.all([
                adminApi.analytics.getMeals(),
                adminApi.analytics.getRecipes(recipeLimit),
            ]);

            if (mealsRes.data.success) setMealData(mealsRes.data.data);
            if (recipesRes.data.success) setRecipes(recipesRes.data.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.alert} ${styles.alertError}`}>
                {error}
            </div>
        );
    }

    const mealStatusData = mealData
        ? [
            { name: 'Completed', value: mealData.breakfast.completed || 0 + (mealData.lunch.completed || 0) + (mealData.dinner.completed || 0) },
            { name: 'Skipped', value: mealData.breakfast.skipped || 0 + (mealData.lunch.skipped || 0) + (mealData.dinner.skipped || 0) },
            { name: 'Pending', value: mealData.breakfast.pending || 0 + (mealData.lunch.pending || 0) + (mealData.dinner.pending || 0) },
        ]
        : [];

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Content Analytics</h1>
                <p className={styles.pageDescription}>
                    Track meal plans, recipes, and content engagement
                </p>
            </div>

            {/* Metrics */}
            {mealData && (
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Total Meal Plans</div>
                        <div className={styles.metricValue}>{mealData.totalPlans.toLocaleString()}</div>
                    </div>

                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Breakfast Completion</div>
                        <div className={styles.metricValue}>
                            {mealData.totalPlans > 0
                                ? ((mealData.breakfast.completed || 0) / mealData.totalPlans * 100).toFixed(0)
                                : 0}%
                        </div>
                        <div className={styles.metricChange}>
                            <span style={{ color: 'var(--admin-text-secondary)' }}>
                                {mealData.breakfast.completed || 0} completed
                            </span>
                        </div>
                    </div>

                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Lunch Completion</div>
                        <div className={styles.metricValue}>
                            {mealData.totalPlans > 0
                                ? ((mealData.lunch.completed || 0) / mealData.totalPlans * 100).toFixed(0)
                                : 0}%
                        </div>
                        <div className={styles.metricChange}>
                            <span style={{ color: 'var(--admin-text-secondary)' }}>
                                {mealData.lunch.completed || 0} completed
                            </span>
                        </div>
                    </div>

                    <div className={styles.metricCard}>
                        <div className={styles.metricLabel}>Dinner Completion</div>
                        <div className={styles.metricValue}>
                            {mealData.totalPlans > 0
                                ? ((mealData.dinner.completed || 0) / mealData.totalPlans * 100).toFixed(0)
                                : 0}%
                        </div>
                        <div className={styles.metricChange}>
                            <span style={{ color: 'var(--admin-text-secondary)' }}>
                                {mealData.dinner.completed || 0} completed
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.chartsGrid}>
                {/* Meal Status Distribution */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Meal Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={mealStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {mealStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '0.375rem',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Popular Recipes */}
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>Popular Recipes (by Plans)</h3>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className={styles.formLabel} htmlFor="limit">
                            Show top {recipeLimit} recipes
                        </label>
                        <select
                            id="limit"
                            className={styles.formInput}
                            value={recipeLimit}
                            onChange={(e) => setRecipeLimit(Number(e.target.value))}
                            style={{ maxWidth: '120px' }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={recipes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                style={{ fontSize: '12px' }}
                                stroke="var(--admin-text-secondary)"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                            />
                            <YAxis style={{ fontSize: '12px' }} stroke="var(--admin-text-secondary)" />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '0.375rem',
                                }}
                            />
                            <Bar dataKey="planCount" fill="var(--admin-primary)" name="Plans" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recipe Details Table */}
            {recipes.length > 0 && (
                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <h3 className={styles.tableTitle}>Recipe Details</h3>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Recipe</th>
                                    <th>In Plans</th>
                                    <th>Saved</th>
                                    <th>Engagement</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipes.map((recipe) => (
                                    <tr key={recipe.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{recipe.name}</div>
                                        </td>
                                        <td>{recipe.planCount.toLocaleString()}</td>
                                        <td>{recipe.saveCount.toLocaleString()}</td>
                                        <td>
                                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                                {recipe.planCount > 0 ? ((recipe.saveCount / recipe.planCount) * 100).toFixed(0) : 0}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
