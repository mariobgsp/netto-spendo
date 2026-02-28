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
    ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { Expense, ChartView, Label } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler, PointElement, LineElement, ArcElement);

interface SpendingChartProps {
    expenses: Expense[];
    labels: Label[];
    view: ChartView;
    onViewChange: (view: ChartView) => void;
}

export const SpendingChart: React.FC<SpendingChartProps> = ({ expenses, labels, view, onViewChange }) => {
    const chartData = useMemo(() => {
        const now = new Date();
        const expenseOnly = expenses.filter(e => !e.type || e.type === 'expense');

        if (view === 'weekly') {
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
            const lbls = days.map((d) => format(d, 'EEE dd', { locale: idLocale }));
            const data = days.map((day) =>
                expenseOnly.filter((e) => isSameDay(new Date(e.date), day)).reduce((sum, e) => sum + e.amount, 0)
            );
            return { labels: lbls, data };
        }

        if (view === 'monthly') {
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
            const lbls = days.map((d) => format(d, 'dd', { locale: idLocale }));
            const data = days.map((day) =>
                expenseOnly.filter((e) => isSameDay(new Date(e.date), day)).reduce((sum, e) => sum + e.amount, 0)
            );
            return { labels: lbls, data };
        }

        // yearly
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
        const lbls = months.map((m) => format(m, 'MMM', { locale: idLocale }));
        const data = months.map((month) =>
            expenseOnly
                .filter((e) => {
                    const expDate = new Date(e.date);
                    return isSameMonth(expDate, month) && isWithinInterval(expDate, { start: yearStart, end: yearEnd });
                })
                .reduce((sum, e) => sum + e.amount, 0)
        );
        return { labels: lbls, data };
    }, [expenses, view]);

    // Label breakdown data
    const labelChartData = useMemo(() => {
        const expenseOnly = expenses.filter(e => !e.type || e.type === 'expense');
        const totals: Record<string, number> = {};
        expenseOnly.forEach(e => {
            const key = e.label_id || '__unlabeled__';
            totals[key] = (totals[key] || 0) + e.amount;
        });
        const labelEntries = labels.map(l => ({ id: l.id, name: l.name, color: l.color, total: totals[l.id] || 0 }));
        const unlabeledTotal = totals['__unlabeled__'] || 0;
        const allEntries = [...labelEntries.filter(e => e.total > 0)];
        if (unlabeledTotal > 0) allEntries.push({ id: '__unlabeled__', name: 'Lainnya', color: '#52525b', total: unlabeledTotal });
        return {
            labels: allEntries.map(e => e.name),
            data: allEntries.map(e => e.total),
            bgColors: allEntries.map(e => e.color + 'cc'),
            borderColors: allEntries.map(e => e.color),
        };
    }, [expenses, labels]);

    const maxVal = view !== 'label' ? Math.max(...chartData.data, 1) : 1;

    const barData = {
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

    const doughnutData = {
        labels: labelChartData.labels,
        datasets: [
            {
                data: labelChartData.data,
                backgroundColor: labelChartData.bgColors,
                borderColor: labelChartData.borderColors,
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    };

    const barOptions = {
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
                        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
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

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#a1a1aa',
                    font: { size: 12 },
                    padding: 16,
                    usePointStyle: true,
                    pointStyleWidth: 10,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(18, 18, 26, 0.95)',
                titleColor: '#e2e8f0',
                bodyColor: '#a1a1aa',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context: any) => {
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                        const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
                        return ` ${formatted} (${pct}%)`;
                    },
                },
            },
        },
        cutout: '65%',
    };

    const viewLabels: Record<ChartView, string> = {
        weekly: 'Mingguan',
        monthly: 'Bulanan',
        yearly: 'Tahunan',
        label: 'Per Label',
    };

    const hasLabelData = labelChartData.data.length > 0;

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
                {view === 'label' ? (
                    hasLabelData ? (
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                    ) : (
                        <div className="chart-empty">
                            <span>📭</span>
                            <p>Belum ada pengeluaran yang terkategorisasi.</p>
                            <p className="empty-sub">Tambah label dan tandai transaksimu.</p>
                        </div>
                    )
                ) : (
                    <Bar data={barData} options={barOptions} />
                )}
            </div>
        </div>
    );
};
