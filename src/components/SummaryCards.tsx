import React, { useMemo } from 'react';
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    isWithinInterval,
} from 'date-fns';
import type { Expense } from '../types';

interface SummaryCardsProps {
    expenses: Expense[];
}

interface CardData {
    label: string;
    amount: number;
    icon: string;
    gradient: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ expenses }) => {
    const cards: CardData[] = useMemo(() => {
        const now = new Date();

        const totalInRange = (start: Date, end: Date) =>
            expenses
                .filter((e) => isWithinInterval(new Date(e.date), { start, end }))
                .reduce((sum, e) => {
                    if (e.type === 'income') return sum + e.amount;
                    return sum - e.amount;
                }, 0);

        return [
            {
                label: 'Saldo Hari Ini',
                amount: totalInRange(startOfDay(now), endOfDay(now)),
                icon: '☀️',
                gradient: 'card-gradient-today',
            },
            {
                label: 'Saldo Minggu Ini',
                amount: totalInRange(
                    startOfWeek(now, { weekStartsOn: 1 }),
                    endOfWeek(now, { weekStartsOn: 1 })
                ),
                icon: '📅',
                gradient: 'card-gradient-week',
            },
            {
                label: 'Saldo Bulan Ini',
                amount: totalInRange(startOfMonth(now), endOfMonth(now)),
                icon: '🗓️',
                gradient: 'card-gradient-month',
            },
            {
                label: 'Saldo Tahun Ini',
                amount: totalInRange(startOfYear(now), endOfYear(now)),
                icon: '🎯',
                gradient: 'card-gradient-year',
            },
        ];
    }, [expenses]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    return (
        <div className="summary-cards">
            {cards.map((card) => (
                <div key={card.label} className={`summary-card ${card.gradient}`}>
                    <div className="card-icon">{card.icon}</div>
                    <div className="card-content">
                        <span className="card-label">{card.label}</span>
                        <span className="card-amount">{formatCurrency(card.amount)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
