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
        console.log('✅ Database initialized — expenses table ready');
    } finally {
        client.release();
    }
}

export default pool;
