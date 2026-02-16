import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { initDB } from './db.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Health check ──────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// ─── GET all expenses ──────────────────────────────────
app.get('/api/expenses', async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, amount, description, date, type, is_archived FROM expenses WHERE is_archived = FALSE ORDER BY date DESC'
        );
        const expenses = result.rows.map((row) => ({
            id: row.id,
            amount: parseFloat(row.amount),
            description: row.description,
            date: row.date.toISOString(),
            type: row.type,
            is_archived: row.is_archived,
        }));
        res.json(expenses);
    } catch (err) {
        console.error('GET /api/expenses error:', err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// ─── POST close book ──────────────────────────────────
app.post('/api/expenses/close-book', async (req, res) => {
    const client = await pool.connect();
    try {
        const { carryForward } = req.body; // boolean
        await client.query('BEGIN');

        // 1. Calculate current balance of unarchived transactions
        const result = await client.query(
            'SELECT amount, type FROM expenses WHERE is_archived = FALSE'
        );
        let balance = 0;
        for (const row of result.rows) {
            const val = parseFloat(row.amount);
            if (row.type === 'income') balance += val;
            else balance -= val;
        }

        // 2. Archive all current transactions
        await client.query('UPDATE expenses SET is_archived = TRUE WHERE is_archived = FALSE');

        // 3. If carryForward, insert new transaction
        if (carryForward && balance > 0) {
            await client.query(
                `INSERT INTO expenses (amount, description, date, type, is_archived)
                 VALUES ($1, $2, NOW(), 'income', FALSE)`,
                [balance, 'Saldo Awal (Tutup Buku)']
            );
        } else if (carryForward && balance < 0) {
            // Optional: Carry forward negative balance as expense?
            // Usually we carry forward net. If negative, it's a debt.
            // Let's record it as expense "Hutang Awal"? Or just "Saldo Awal" (Expense).
            await client.query(
                `INSERT INTO expenses (amount, description, date, type, is_archived)
                 VALUES ($1, $2, NOW(), 'expense', FALSE)`,
                [Math.abs(balance), 'Saldo Awal (Minus)']
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, balance });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /api/expenses/close-book error:', err);
        res.status(500).json({ error: 'Failed to close book' });
    } finally {
        client.release();
    }
});

// ─── POST create expense ──────────────────────────────
app.post('/api/expenses', async (req, res) => {
    try {
        const { amount, description, date, type } = req.body;

        if (!amount || !description) {
            res.status(400).json({ error: 'amount and description are required' });
            return;
        }

        const result = await pool.query(
            'INSERT INTO expenses (amount, description, date, type) VALUES ($1, $2, $3, $4) RETURNING id, amount, description, date, type',
            [amount, description, date || new Date().toISOString(), type || 'expense']
        );

        const row = result.rows[0];
        res.status(201).json({
            id: row.id,
            amount: parseFloat(row.amount),
            description: row.description,
            date: row.date.toISOString(),
            type: row.type,
        });
    } catch (err) {
        console.error('POST /api/expenses error:', err);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});

// ─── PUT update expense ───────────────────────────────
app.put('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description, date, type } = req.body;

        if (!amount || !description) {
            res.status(400).json({ error: 'amount and description are required' });
            return;
        }

        const result = await pool.query(
            'UPDATE expenses SET amount = $1, description = $2, date = $3, type = $4 WHERE id = $5 RETURNING id, amount, description, date, type',
            [amount, description, date || new Date().toISOString(), type || 'expense', id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }

        const row = result.rows[0];
        res.json({
            id: row.id,
            amount: parseFloat(row.amount),
            description: row.description,
            date: row.date.toISOString(),
            type: row.type,
        });
    } catch (err) {
        console.error('PUT /api/expenses error:', err);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// ─── DELETE expense ────────────────────────────────────
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM expenses WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Expense not found' });
            return;
        }

        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/expenses error:', err);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

// ─── Start server ──────────────────────────────────────
async function start() {
    try {
        await initDB();
        app.listen(PORT, () => {
            console.log(`🚀 Backend running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

start();
