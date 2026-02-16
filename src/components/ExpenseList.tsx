import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Expense, TransactionType } from '../types';

interface ExpenseListProps {
    expenses: Expense[];
    onEdit: (id: string, expense: Omit<Expense, 'id'>) => void | Promise<void>;
    onDelete: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onDelete }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editType, setEditType] = useState<TransactionType>('expense');
    const [editAmount, setEditAmount] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDate, setEditDate] = useState('');

    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses]);

    const formatCurrency = (amount: number, type: TransactionType) => {
        const formatted = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
        return type === 'income' ? `+ ${formatted}` : `- ${formatted}`;
    };

    const startEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setEditType(expense.type || 'expense');
        setEditAmount(expense.amount.toString());
        setEditDescription(expense.description);
        const d = new Date(expense.date);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        setEditDate(local.toISOString().slice(0, 16));
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        const parsedAmount = parseFloat(editAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0 || !editDescription.trim()) return;

        await onEdit(editingId, {
            amount: parsedAmount,
            description: editDescription.trim(),
            date: new Date(editDate).toISOString(),
            type: editType,
        });
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') cancelEdit();
    };

    if (sortedExpenses.length === 0) {
        return (
            <div className="expense-list empty">
                <div className="empty-state">
                    <span className="empty-icon">📋</span>
                    <p>Belum ada transaksi.</p>
                    <p className="empty-sub">Mulai catat pemasukan dan pengeluaranmu!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="expense-list">
            <h2 className="list-title">
                <span className="list-icon">📝</span>
                Riwayat Transaksi
                <span className="list-count">{sortedExpenses.length}</span>
            </h2>
            <div className="list-scroll">
                {sortedExpenses.map((expense, index) => (
                    <div
                        key={expense.id}
                        className={`expense-item ${editingId === expense.id ? 'editing' : ''}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        {editingId === expense.id ? (
                            <div className="edit-form">
                                <div className="type-toggle">
                                    <button
                                        className={`toggle-option ${editType === 'expense' ? 'active expense' : ''}`}
                                        onClick={() => setEditType('expense')}
                                    >
                                        Pengeluaran
                                    </button>
                                    <button
                                        className={`toggle-option ${editType === 'income' ? 'active income' : ''}`}
                                        onClick={() => setEditType('income')}
                                    >
                                        Pemasukan
                                    </button>
                                </div>
                                <div className="edit-row">
                                    <div className="edit-field">
                                        <label>Jumlah</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="100"
                                            value={editAmount}
                                            onChange={(e) => setEditAmount(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="edit-field">
                                        <label>Keterangan</label>
                                        <input
                                            type="text"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>
                                </div>
                                <div className="edit-row">
                                    <div className="edit-field">
                                        <label>Waktu</label>
                                        <input
                                            type="datetime-local"
                                            value={editDate}
                                            onChange={(e) => setEditDate(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>
                                    <div className="edit-actions">
                                        <button className="btn-save" onClick={saveEdit}>
                                            ✓ Simpan
                                        </button>
                                        <button className="btn-cancel" onClick={cancelEdit}>
                                            ✕ Batal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="expense-info">
                                    <span className="expense-desc">{expense.description}</span>
                                    <span className="expense-date">
                                        {format(new Date(expense.date), 'dd MMM yyyy, HH:mm', { locale: id })}
                                    </span>
                                </div>
                                <div className="expense-actions">
                                    <span
                                        className={`expense-amount ${expense.type === 'income' ? 'amount-income' : 'amount-expense'
                                            }`}
                                    >
                                        {formatCurrency(expense.amount, expense.type || 'expense')}
                                    </span>
                                    <button
                                        className="btn-edit"
                                        onClick={() => startEdit(expense)}
                                        title="Edit"
                                        aria-label="Edit transaksi"
                                    >
                                        ✎
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => onDelete(expense.id)}
                                        title="Hapus"
                                        aria-label="Hapus transaksi"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
