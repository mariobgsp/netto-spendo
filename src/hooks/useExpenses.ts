import { useState, useEffect, useCallback } from 'react';
import type { Expense, Book } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STORAGE_KEY_EXPENSES = 'netto-spendo-expenses';
const STORAGE_KEY_BOOKS = 'netto-spendo-books';

function loadLocal<T>(key: string): T[] {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
        return [];
    }
}

function saveLocal<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
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
    const [expenses, setExpenses] = useState<Expense[]>(() => loadLocal<Expense>(STORAGE_KEY_EXPENSES));
    const [books, setBooks] = useState<Book[]>(() => loadLocal<Book>(STORAGE_KEY_BOOKS));
    const [currentBook, setCurrentBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);

    // Initial load
    useEffect(() => {
        async function init() {
            // 1. Fetch Books
            const fetchedBooks = await tryFetch<Book[]>(`${API_URL}/api/books`);
            if (fetchedBooks) {
                setIsOnline(true);
                setBooks(fetchedBooks);
                saveLocal(STORAGE_KEY_BOOKS, fetchedBooks);

                // Set current book (default to first active or just first)
                if (fetchedBooks.length > 0) {
                    // Prefer the first book (which is sorted by start_date DESC in backend)
                    setCurrentBook(fetchedBooks[0]);
                }
            } else {
                // Offline: use local books, set first as current
                if (books.length > 0) {
                    setCurrentBook(books[0]);
                }
            }
            setLoading(false);
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load expenses when currentBook changes
    useEffect(() => {
        if (!currentBook) {
            setExpenses([]);
            return;
        }

        async function loadExpenses() {
            const data = await tryFetch<Expense[]>(`${API_URL}/api/expenses?bookId=${currentBook?.id}`);
            if (data) {
                setExpenses(data);
                saveLocal(STORAGE_KEY_EXPENSES, data); // Note: this might overwrite other books' cache?
                // For simplicity, we just cache the *current view* locally.
                // A better approach would be to cache by bookId key.
            }
        }
        loadExpenses();
    }, [currentBook]);

    const selectBook = useCallback((book: Book) => {
        setCurrentBook(book);
    }, []);

    const createBook = useCallback(async (name: string) => {
        const result = await tryFetch<Book>(`${API_URL}/api/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });

        if (result) {
            setBooks(prev => [result, ...prev]);
            saveLocal(STORAGE_KEY_BOOKS, [result, ...books]);
            setCurrentBook(result); // Switch to new book
        }
    }, [books]);

    const renameBook = useCallback(async (id: string, name: string) => {
        const result = await tryFetch<Book>(`${API_URL}/api/books/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });

        if (result) {
            setBooks(prev => prev.map(b => b.id === id ? result : b));
            if (currentBook?.id === id) {
                setCurrentBook(result);
            }
        }
    }, [books, currentBook]);

    const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
        if (!currentBook) return;

        // Try API first
        const created = await tryFetch<Expense>(`${API_URL}/api/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...expense, bookId: currentBook.id }),
        });

        if (created) {
            setExpenses((prev) => [created, ...prev]);
        }
    }, [currentBook]);

    const updateExpense = useCallback(async (id: string, expense: Omit<Expense, 'id'>) => {
        const updated = await tryFetch<Expense>(`${API_URL}/api/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense),
        });

        if (updated) {
            setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
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
        if (!isOnline || !currentBook) {
            alert('Fitur Tutup Buku hanya tersedia saat online dan ada buku aktif.');
            return;
        }

        const result = await tryFetch<{ success: boolean, newBookId: string }>(`${API_URL}/api/expenses/close-book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carryForward, bookId: currentBook.id }),
        });

        if (result) {
            // Re-fetch books to get the new one and the closed one updated
            const fetchedBooks = await tryFetch<Book[]>(`${API_URL}/api/books`);
            if (fetchedBooks) {
                setBooks(fetchedBooks);
                // Switch to the NEW book
                const newBook = fetchedBooks.find(b => b.id === result.newBookId);
                if (newBook) setCurrentBook(newBook);
            }
        }
    }, [isOnline, currentBook]);

    const deleteBook = useCallback(async (id: string) => {
        const result = await tryFetch<{ success: boolean }>(`${API_URL}/api/books/${id}`, {
            method: 'DELETE',
        });

        if (result) {
            setBooks(prev => {
                const newBooks = prev.filter(b => b.id !== id);
                // If we deleted the current book, switch to another one
                if (currentBook?.id === id) {
                    const nextBook = newBooks[0] || null;
                    setCurrentBook(nextBook);
                }
                saveLocal(STORAGE_KEY_BOOKS, newBooks);
                return newBooks;
            });
        }
    }, [books, currentBook]);

    return {
        expenses,
        books,
        currentBook,
        loading,
        isOnline,
        addExpense,
        updateExpense,
        deleteExpense,
        closeBook,
        selectBook,
        createBook,
        renameBook,
        deleteBook
    };
}
