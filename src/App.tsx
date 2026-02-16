import { useState, useMemo } from 'react';
import { useExpenses } from './hooks/useExpenses';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { SpendingChart } from './components/SpendingChart';
import { SummaryCards } from './components/SummaryCards';
import { CloseBookModal } from './components/CloseBookModal';
import type { ChartView } from './types';
import './index.css';

function App() {
    const { expenses, addExpense, updateExpense, deleteExpense, closeBook, loading, isOnline } = useExpenses();
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
                        {!isOnline && <span className="offline-badge">Offline Mode</span>}
                    </div>
                    <button
                        className="btn-close-book"
                        onClick={() => setIsCloseBookOpen(true)}
                        title="Tutup Buku Periode Ini"
                    >
                        📦 Tutup Buku
                    </button>
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
                                    view={chartView}
                                    onViewChange={setChartView}
                                />
                                <ExpenseList
                                    expenses={expenses}
                                    onEdit={updateExpense}
                                    onDelete={deleteExpense}
                                />
                            </div>
                            <div className="side-col">
                                <ExpenseForm onAdd={addExpense} />
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
                <p>© 2026 Netto Spendo. Data disimpan di PostgreSQL.</p>
            </footer>
        </div>
    );
}

export default App;
