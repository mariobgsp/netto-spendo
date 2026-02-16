export type TransactionType = 'expense' | 'income';

export interface Expense {
    id: string;
    amount: number;
    description: string;
    date: string; // ISO string
    type: TransactionType;
    is_archived?: boolean; // For "Tutup Buku" feature
}

export type ChartView = 'weekly' | 'monthly' | 'yearly';
