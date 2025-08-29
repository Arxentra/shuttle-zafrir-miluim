import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const { Pool } = pg;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@postgres:5432/tzafrir_shuttle',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});