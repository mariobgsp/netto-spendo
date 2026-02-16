import { useState, useEffect, useCallback } from 'react';
import type { Expense } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'netto-spendo-expenses';

function loadLocal(): Expense[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Expense[]) : [];
    } catch {
        return [];
    }
}

function saveLocal(expenses: Expense[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

async function tryFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
    try {
        const res = await fetch(url, options);
        if (res.ok) return (await res.json()) as T;
        return null;
    } catch {
        return null;
    }
}

export function useExpenses() {
    const [expenses, setExpenses] = useState<Expense[]>(loadLocal);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);

    // Try to load from API on mount; fall back to localStorage
    useEffect(() => {
        async function init() {
            const data = await tryFetch<Expense[]>(`${API_URL}/api/expenses`);
            if (data) {
                setIsOnline(true);
                // Merge: API is source of truth, but keep local-only entries
                const apiIds = new Set(data.map((e) => e.id));
                const localOnly = loadLocal().filter((e) => !apiIds.has(e.id));
                const merged = [...data, ...localOnly];
                setExpenses(merged);
                saveLocal(merged);
            }
            // If API unreachable, we already have localStorage data from useState
            setLoading(false);
        }
        init();
    }, []);

    // Persist to localStorage on every change
    useEffect(() => {
        saveLocal(expenses);
    }, [expenses]);

    const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
        // Try API first
        const created = await tryFetch<Expense>(`${API_URL}/api/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense),
        });

        if (created) {
            setExpenses((prev) => [created, ...prev]);
        } else {
            // Offline: save locally with generated ID
            const localExpense: Expense = {
                ...expense,
                id: crypto.randomUUID(),
            };
            setExpenses((prev) => [localExpense, ...prev]);
        }
    }, []);

    const updateExpense = useCallback(async (id: string, expense: Omit<Expense, 'id'>) => {
        const updated = await tryFetch<Expense>(`${API_URL}/api/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense),
        });

        if (updated) {
            setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
        } else {
            // Offline: update locally
            setExpenses((prev) =>
                prev.map((e) => (e.id === id ? { ...expense, id } : e))
            );
        }
    }, []);

    const deleteExpense = useCallback(async (id: string) => {
        const result = await tryFetch<{ success: boolean }>(`${API_URL}/api/expenses/${id}`, {
            method: 'DELETE',
        });

        if (result || !isOnline) {
            setExpenses((prev) => prev.filter((e) => e.id !== id));
        }
    }, [isOnline]);

    const closeBook = useCallback(async (carryForward: boolean) => {
        // Only online for now as it's a complex operation involving archiving
        if (!isOnline) {
            alert('Fitur Tutup Buku hanya tersedia saat online.');
            return;
        }

        const result = await tryFetch<{ success: boolean }>(`${API_URL}/api/expenses/close-book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carryForward }),
        });

        if (result) {
            // Refresh entirely from server to get clean state
            const data = await tryFetch<Expense[]>(`${API_URL}/api/expenses`);
            if (data) {
                setExpenses(data);
                saveLocal(data);
            }
        }
    }, [isOnline]);

    return { expenses, addExpense, updateExpense, deleteExpense, closeBook, loading, isOnline };
}
