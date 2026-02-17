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

// ─── GET all books ──────────────────────────────────────
app.get('/api/books', async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, start_date, end_date, created_at FROM books ORDER BY start_date DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/books error:', err);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// ─── POST create book ───────────────────────────────────
app.post('/api/books', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ error: 'name is required' });
            return;
        }
        const result = await pool.query(
            'INSERT INTO books (name, start_date) VALUES ($1, NOW()) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /api/books error:', err);
        res.status(500).json({ error: 'Failed to create book' });
    }
});

// ─── PUT update book ────────────────────────────────────
app.put('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ error: 'name is required' });
            return;
        }
        const result = await pool.query(
            'UPDATE books SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT /api/books/:id error:', err);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

// ─── DELETE book ────────────────────────────────────────
app.delete('/api/books/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        // 1. Delete all expenses in this book
        await client.query('DELETE FROM expenses WHERE book_id = $1', [id]);

        // 2. Delete the book
        const result = await client.query('DELETE FROM books WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Book not found' });
            return;
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('DELETE /api/books/:id error:', err);
        res.status(500).json({ error: 'Failed to delete book' });
    } finally {
        client.release();
    }
});

// ─── GET expenses (filtered by book) ────────────────────
app.get('/api/expenses', async (req, res) => {
    try {
        const { bookId } = req.query;
        let query = 'SELECT id, amount, description, date, type, is_archived, book_id FROM expenses WHERE is_archived = FALSE';
        const params: any[] = [];

        if (bookId) {
            query += ' AND book_id = $1';
            params.push(bookId);
        } else {
            // If no specific book requested, maybe default to the latest open book? 
            // Or just return all unarchived?
            // For safety/backward compat, let's just return all unarchived.
            // But UI should send bookId.
        }

        query += ' ORDER BY date DESC';

        const result = await pool.query(query, params);
        const expenses = result.rows.map((row) => ({
            id: row.id,
            amount: parseFloat(row.amount),
            description: row.description,
            date: row.date.toISOString(),
            type: row.type,
            is_archived: row.is_archived,
            book_id: row.book_id
        }));
        res.json(expenses);
    } catch (err) {
        console.error('GET /api/expenses error:', err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// ─── POST close book (updated) ────────────────────────
app.post('/api/expenses/close-book', async (req, res) => {
    const client = await pool.connect();
    try {
        const { carryForward, bookId } = req.body;

        if (!bookId) {
            res.status(400).json({ error: 'bookId is required' });
            return;
        }

        await client.query('BEGIN');

        // 1. Calculate current balance of unarchived transactions FOR THIS BOOK
        const result = await client.query(
            'SELECT amount, type FROM expenses WHERE is_archived = FALSE AND book_id = $1',
            [bookId]
        );
        let balance = 0;
        for (const row of result.rows) {
            const val = parseFloat(row.amount);
            if (row.type === 'income') balance += val;
            else balance -= val;
        }

        // 2. Archive all current transactions in this book
        await client.query('UPDATE expenses SET is_archived = TRUE WHERE is_archived = FALSE AND book_id = $1', [bookId]);

        // 3. Close the book itself
        await client.query('UPDATE books SET end_date = NOW() WHERE id = $1', [bookId]);

        // 4. Create new book
        // Get old book name to generate new name? Or just "New Book"?
        // Let's call it "Buku Baru" for now, user can rename.
        const newBookRes = await client.query("INSERT INTO books (name, start_date) VALUES ('Buku Baru', NOW()) RETURNING id");
        const newBookId = newBookRes.rows[0].id;

        // 5. If carryForward, insert new transaction in NEW BOOK
        if (carryForward && balance > 0) {
            await client.query(
                `INSERT INTO expenses (amount, description, date, type, is_archived, book_id)
                 VALUES ($1, $2, NOW(), 'income', FALSE, $3)`,
                [balance, 'Saldo Awal (Tutup Buku)', newBookId]
            );
        } else if (carryForward && balance < 0) {
            await client.query(
                `INSERT INTO expenses (amount, description, date, type, is_archived, book_id)
                 VALUES ($1, $2, NOW(), 'expense', FALSE, $3)`,
                [Math.abs(balance), 'Saldo Awal (Minus)', newBookId]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, balance, newBookId });
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
        const { amount, description, date, type, bookId } = req.body;

        if (!amount || !description || !bookId) {
            res.status(400).json({ error: 'amount, description, and bookId are required' });
            return;
        }

        const result = await pool.query(
            'INSERT INTO expenses (amount, description, date, type, book_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, amount, description, date, type, book_id',
            [amount, description, date || new Date().toISOString(), type || 'expense', bookId]
        );

        const row = result.rows[0];
        res.status(201).json({
            id: row.id,
            amount: parseFloat(row.amount),
            description: row.description,
            date: row.date.toISOString(),
            type: row.type,
            book_id: row.book_id
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
            'UPDATE expenses SET amount = $1, description = $2, date = $3, type = $4 WHERE id = $5 RETURNING id, amount, description, date, type, book_id',
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
            book_id: row.book_id
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
