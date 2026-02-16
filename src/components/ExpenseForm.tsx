import React, { useState } from 'react';
import type { Expense, TransactionType } from '../types';

interface ExpenseFormProps {
    onAdd: (expense: Omit<Expense, 'id'>) => void | Promise<void>;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd }) => {
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0 || !description.trim()) return;

        setIsSubmitting(true);
        await onAdd({
            amount: parsedAmount,
            description: description.trim(),
            date: new Date(date).toISOString(),
            type,
        });

        setAmount('');
        setDescription('');
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - offset * 60000);
        setDate(local.toISOString().slice(0, 16));
        // Keep the same type for convenience, or reset? Let's keep it.

        setTimeout(() => setIsSubmitting(false), 300);
    };

    return (
        <form className={`expense-form ${isSubmitting ? 'submitted' : ''}`} onSubmit={handleSubmit}>
            <h2 className="form-title">
                <span className="form-icon">💸</span>
                Transaksi Baru
            </h2>

            <div className="type-toggle-container">
                <div className="type-toggle">
                    <button
                        type="button"
                        className={`toggle-option ${type === 'expense' ? 'active expense' : ''}`}
                        onClick={() => setType('expense')}
                    >
                        Pengeluaran
                    </button>
                    <button
                        type="button"
                        className={`toggle-option ${type === 'income' ? 'active income' : ''}`}
                        onClick={() => setType('income')}
                    >
                        Pemasukan
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="amount">Jumlah (Rp)</label>
                <div className="input-wrapper">
                    <span className={`input-prefix ${type === 'income' ? 'income-text' : ''}`}>Rp</span>
                    <input
                        id="amount"
                        type="number"
                        min="0"
                        step="100"
                        placeholder="50000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="description">Keterangan</label>
                <input
                    id="description"
                    type="text"
                    placeholder="Makan siang, Gaji, dll."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="date">Waktu</label>
                <input
                    id="date"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
            </div>
            <button type="submit" className="btn-submit">
                <span>+ Tambah</span>
            </button>
        </form>
    );
};
