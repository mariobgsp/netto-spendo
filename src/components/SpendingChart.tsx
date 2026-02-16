import React, { useMemo } from 'react';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    eachDayOfInterval,
    eachMonthOfInterval,
    format,
    isWithinInterval,
    isSameDay,
    isSameMonth,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { Expense, ChartView } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler, PointElement, LineElement);

interface SpendingChartProps {
    expenses: Expense[];
    view: ChartView;
    onViewChange: (view: ChartView) => void;
}

export const SpendingChart: React.FC<SpendingChartProps> = ({ expenses, view, onViewChange }) => {
    const chartData = useMemo(() => {
        const now = new Date();
        const expenseOnly = expenses.filter(e => !e.type || e.type === 'expense');

        if (view === 'weekly') {
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

            const labels = days.map((d) => format(d, 'EEE dd', { locale: idLocale }));
            const data = days.map((day) =>
                expenseOnly
                    .filter((e) => isSameDay(new Date(e.date), day))
                    .reduce((sum, e) => sum + e.amount, 0)
            );

            return { labels, data };
        }

        if (view === 'monthly') {
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

            const labels = days.map((d) => format(d, 'dd', { locale: idLocale }));
            const data = days.map((day) =>
                expenseOnly
                    .filter((e) => isSameDay(new Date(e.date), day))
                    .reduce((sum, e) => sum + e.amount, 0)
            );

            return { labels, data };
        }

        // yearly
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

        const labels = months.map((m) => format(m, 'MMM', { locale: idLocale }));
        const data = months.map((month) =>
            expenseOnly
                .filter((e) => {
                    const expDate = new Date(e.date);
                    return (
                        isSameMonth(expDate, month) &&
                        isWithinInterval(expDate, { start: yearStart, end: yearEnd })
                    );
                })
                .reduce((sum, e) => sum + e.amount, 0)
        );

        return { labels, data };
    }, [expenses, view]);

    const maxVal = Math.max(...chartData.data, 1);

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Pengeluaran (Rp)',
                data: chartData.data,
                backgroundColor: chartData.data.map((val) => {
                    const intensity = Math.max(0.3, val / maxVal);
                    return `rgba(139, 92, 246, ${intensity})`;
                }),
                borderColor: 'rgba(139, 92, 246, 0.8)',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false as const,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(18, 18, 26, 0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#a78bfa',
                borderColor: 'rgba(139, 92, 246, 0.3)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context: any) => {
                        const value = context.parsed.y;
                        if (value === null || value === undefined) return '';
                        return new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                        }).format(value);
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748b', font: { size: 11 } },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: {
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (value: string | number) => {
                        const num = typeof value === 'string' ? parseFloat(value) : value;
                        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}jt`;
                        if (num >= 1000) return `${(num / 1000).toFixed(0)}rb`;
                        return num.toString();
                    },
                },
            },
        },
    };

    const viewLabels: Record<ChartView, string> = {
        weekly: 'Mingguan',
        monthly: 'Bulanan',
        yearly: 'Tahunan',
    };

    return (
        <div className="spending-chart">
            <div className="chart-header">
                <h2 className="chart-title">
                    <span className="chart-icon">📊</span>
                    Grafik Pengeluaran
                </h2>
                <div className="chart-view-toggle">
                    {(Object.keys(viewLabels) as ChartView[]).map((v) => (
                        <button
                            key={v}
                            className={`toggle-btn ${v === view ? 'active' : ''}`}
                            onClick={() => onViewChange(v)}
                        >
                            {viewLabels[v]}
                        </button>
                    ))}
                </div>
            </div>
            <div className="chart-container">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};
