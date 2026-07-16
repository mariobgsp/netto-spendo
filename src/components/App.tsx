'use client';

import { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';
import { SpendingChart } from './SpendingChart';
import { SummaryCards } from './SummaryCards';
import { CloseBookModal } from './CloseBookModal';
import { BookList } from './BookList';
import { LabelManager } from './LabelManager';
import type { ChartView } from '@/types';

function App() {
    const {
        expenses,
        books,
        labels,
        currentBook,
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
        loading,
        isOnline,
    } = useExpenses();
    const [chartView, setChartView] = useState<ChartView>('weekly');
    const [isCloseBookOpen, setIsCloseBookOpen] = useState(false);

    const currentBalance = useMemo(() => {
        return expenses.reduce((acc, curr) => {
            const amount = curr.amount;
            if (curr.type === 'income') return acc + amount;
            return acc - amount;
        }, 0);
    }, [expenses]);

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-content">
                    <div className="brand">
                        <h1>Netto Spendo</h1>
                        {currentBook && <span className="current-book-badge">{currentBook.name}</span>}
                        {!isOnline && <span className="offline-dot" title="Offline Mode"></span>}
                    </div>
                    {currentBook && !currentBook.end_date && (
                        <button
                            className="btn-close-book"
                            onClick={() => setIsCloseBookOpen(true)}
                            title="Tutup Buku Periode Ini"
                        >
                            📦 Tutup Buku
                        </button>
                    )}
                </div>
            </header>

            <main className="app-main">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Memuat data...</p>
                    </div>
                ) : (
                    <>
                        <SummaryCards expenses={expenses} />

                        <div className="dashboard-grid">
                            <div className="main-col">
                                <SpendingChart
                                    expenses={expenses}
                                    labels={labels}
                                    view={chartView}
                                    onViewChange={setChartView}
                                />
                                <ExpenseList
                                    expenses={expenses}
                                    labels={labels}
                                    onEdit={updateExpense}
                                    onDelete={deleteExpense}
                                />
                            </div>
                            <div className="side-col">
                                <BookList
                                    books={books}
                                    currentBook={currentBook}
                                    onSelectBook={selectBook}
                                    onCreateBook={createBook}
                                    onRenameBook={renameBook}
                                    onDeleteBook={deleteBook}
                                />
                                <LabelManager
                                    labels={labels}
                                    onAdd={addLabel}
                                    onUpdate={updateLabel}
                                    onDelete={deleteLabel}
                                />
                                {currentBook && !currentBook.end_date ? (
                                    <ExpenseForm onAdd={addExpense} labels={labels} />
                                ) : (
                                    <div className="card info-card">
                                        <p>
                                            {currentBook
                                                ? 'Buku ini telah ditutup. Anda tidak dapat menambah transaksi.'
                                                : 'Silakan pilih atau buat buku baru.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>

            <CloseBookModal
                isOpen={isCloseBookOpen}
                onClose={() => setIsCloseBookOpen(false)}
                onConfirm={closeBook}
                currentBalance={currentBalance}
            />

            <footer className="app-footer">
                <p>© 2026 Netto Spendo. Data disimpan aman di Firebase Firestore.</p>
            </footer>
        </div>
    );
}

export default App;
