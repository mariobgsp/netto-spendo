export interface Book {
    id: string;
    name: string;
    start_date: string;
    end_date?: string;
    created_at: string;
}

export type TransactionType = 'expense' | 'income';

export interface Expense {
    id: string;
    amount: number;
    description: string;
    date: string; // ISO string
    type: TransactionType;
    is_archived?: boolean; // For "Tutup Buku" feature
    book_id?: string;
}

export type ChartView = 'weekly' | 'monthly' | 'yearly';
