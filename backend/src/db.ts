import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDB(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        amount NUMERIC(15, 2) NOT NULL,
        description TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        type TEXT NOT NULL DEFAULT 'expense',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    // Migration: add type column if missing (existing DBs)
    await client.query(`
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense';
    `);
    // Migration: add is_archived column
    await client.query(`
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // ─── NEW: Books Implementation ─────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        end_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES books(id);
    `);

    // Migration: Create default book if none exists and assign existing expenses
    const bookResult = await client.query('SELECT id FROM books LIMIT 1');
    if (bookResult.rowCount === 0) {
      console.log('📚 Creating default book...');
      const newBookResult = await client.query(`
        INSERT INTO books (name, start_date) VALUES ('Buku Utama', NOW()) RETURNING id
      `);
      const defaultBookId = newBookResult.rows[0].id;

      // Assign all existing expenses to this book
      await client.query('UPDATE expenses SET book_id = $1 WHERE book_id IS NULL', [defaultBookId]);
      console.log('✅ Assigned existing expenses to default book');
    } else {
      // Ensure any stray expenses (if any) get assigned to the latest open book or a default one
      // For now, let's just assign NULL book_id to the most recent book if strictly needed, 
      // but the above migrations cover the transition case.
    }
    console.log('✅ Database initialized — expenses table ready');
  } finally {
    client.release();
  }
}

export default pool;
