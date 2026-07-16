'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Expense, Book, Label } from '@/types';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true); // Assuming true, offline handled by Firestore

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const booksSnap = await getDocs(
          query(collection(db, 'books'), orderBy('start_date', 'desc'))
        );
        const fetchedBooks = booksSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            start_date: data.start_date?.toDate?.().toISOString() || data.start_date,
            end_date: data.end_date?.toDate?.().toISOString() || data.end_date,
            created_at: data.created_at?.toDate?.().toISOString() || data.created_at,
          };
        }) as Book[];
        
        setBooks(fetchedBooks);
        if (fetchedBooks.length > 0) {
          setCurrentBook(fetchedBooks[0]);
        }

        const labelsSnap = await getDocs(
          query(collection(db, 'labels'), orderBy('created_at', 'asc'))
        );
        const fetchedLabels = labelsSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          created_at: d.data().created_at?.toDate?.().toISOString() || d.data().created_at,
        })) as Label[];
        
        setLabels(fetchedLabels);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Load expenses when currentBook changes
  useEffect(() => {
    if (!currentBook) {
      setExpenses([]);
      return;
    }

    async function loadExpenses() {
      try {
        const q = query(
          collection(db, 'expenses'),
          where('book_id', '==', currentBook!.id),
          where('is_archived', '==', false),
          orderBy('date', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => {
            const expenseData = d.data();
            return {
                id: d.id,
                ...expenseData,
                date: expenseData.date?.toDate?.().toISOString() || expenseData.date,
            };
        }) as Expense[];
        setExpenses(data);
      } catch (error) {
        console.error("Error loading expenses:", error);
      }
    }
    loadExpenses();
  }, [currentBook]);

  const selectBook = useCallback((book: Book) => {
    setCurrentBook(book);
  }, []);

  const createBook = useCallback(async (name: string) => {
    const docRef = await addDoc(collection(db, 'books'), {
      name,
      start_date: serverTimestamp(),
      created_at: serverTimestamp()
    });
    
    const newBook: Book = {
        id: docRef.id,
        name,
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString()
    };
    
    setBooks(prev => [newBook, ...prev]);
    setCurrentBook(newBook);
  }, []);

  const renameBook = useCallback(async (id: string, name: string) => {
    await updateDoc(doc(db, 'books', id), { name });
    
    setBooks(prev => prev.map(b => b.id === id ? { ...b, name } : b));
    if (currentBook?.id === id) {
      setCurrentBook(prev => prev ? { ...prev, name } : null);
    }
  }, [currentBook]);

  const deleteBook = useCallback(async (id: string) => {
    // Delete all expenses for this book
    const expensesSnap = await getDocs(query(collection(db, 'expenses'), where('book_id', '==', id)));
    const batch = writeBatch(db);
    
    expensesSnap.docs.forEach(d => {
        batch.delete(d.ref);
    });
    batch.delete(doc(db, 'books', id));
    
    await batch.commit();

    setBooks(prev => {
      const newBooks = prev.filter(b => b.id !== id);
      if (currentBook?.id === id) {
        setCurrentBook(newBooks[0] || null);
      }
      return newBooks;
    });
  }, [currentBook]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
    if (!currentBook) return;

    const newExpenseData = { ...expense, book_id: currentBook.id, is_archived: false };
    const docRef = await addDoc(collection(db, 'expenses'), newExpenseData);
    
    setExpenses(prev => [{ id: docRef.id, ...newExpenseData }, ...prev]);
  }, [currentBook]);

  const updateExpense = useCallback(async (id: string, expense: Omit<Expense, 'id'>) => {
    await updateDoc(doc(db, 'expenses', id), expense as any);
    
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...expense } : e));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const closeBook = useCallback(async (carryForward: boolean) => {
    if (!currentBook) return;

    const balance = expenses.reduce((acc, curr) => {
        return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);

    const batch = writeBatch(db);

    // Archive all current expenses
    const expensesSnap = await getDocs(
        query(collection(db, 'expenses'), where('book_id', '==', currentBook.id), where('is_archived', '==', false))
    );
    
    expensesSnap.docs.forEach(d => {
        batch.update(d.ref, { is_archived: true });
    });

    // Close current book
    batch.update(doc(db, 'books', currentBook.id), { end_date: serverTimestamp() });

    // Create new book
    const newBookRef = doc(collection(db, 'books'));
    batch.set(newBookRef, {
        name: 'Buku Baru',
        start_date: serverTimestamp(),
        created_at: serverTimestamp()
    });

    let carryForwardRef = null;
    let carryForwardData = null;
    if (carryForward && balance !== 0) {
        carryForwardRef = doc(collection(db, 'expenses'));
        carryForwardData = {
            book_id: newBookRef.id,
            amount: Math.abs(balance),
            description: balance > 0 ? 'Saldo Awal (Tutup Buku)' : 'Saldo Awal (Minus)',
            type: balance > 0 ? 'income' : 'expense',
            date: new Date().toISOString(), // Use JS Date string to immediately reflect locally
            is_archived: false
        };
        batch.set(carryForwardRef, carryForwardData);
    }

    await batch.commit();
    
    // Refresh books
    const booksSnap = await getDocs(
        query(collection(db, 'books'), orderBy('start_date', 'desc'))
    );
    const fetchedBooks = booksSnap.docs.map(d => {
        const data = d.data();
        return {
        id: d.id,
        name: data.name,
        start_date: data.start_date?.toDate?.().toISOString() || data.start_date,
        end_date: data.end_date?.toDate?.().toISOString() || data.end_date,
        created_at: data.created_at?.toDate?.().toISOString() || data.created_at,
        };
    }) as Book[];
    
    setBooks(fetchedBooks);
    
    const newBook = fetchedBooks.find(b => b.id === newBookRef.id);
    if (newBook) {
        setCurrentBook(newBook);
    }
  }, [currentBook, expenses]);

  const addLabel = useCallback(async (name: string, color: string) => {
    const docRef = await addDoc(collection(db, 'labels'), {
        name,
        color,
        created_at: serverTimestamp()
    });
    setLabels(prev => [...prev, { id: docRef.id, name, color, created_at: new Date().toISOString() }]);
  }, []);

  const updateLabel = useCallback(async (id: string, name: string, color: string) => {
    await updateDoc(doc(db, 'labels', id), { name, color });
    setLabels(prev => prev.map(l => l.id === id ? { ...l, name, color } : l));
  }, []);

  const deleteLabel = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'labels', id));
    setLabels(prev => prev.filter(l => l.id !== id));
    setExpenses(prev => prev.map(e => e.label_id === id ? { ...e, label_id: undefined } : e));
  }, []);

  return {
    expenses,
    books,
    labels,
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
    deleteBook,
    addLabel,
    updateLabel,
    deleteLabel,
  };
}
