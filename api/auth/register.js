// Vercel Serverless Function for Register
// Uses Turso (LibSQL) for cloud SQLite database

import bcrypt from 'bcryptjs';

let db = null;

async function getDatabase() {
  if (db) return db;
  
  const { createClient } = await import('@libsql/client');
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      preferences TEXT NOT NULL DEFAULT '{"role":"student"}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  `);
  
  return db;
}

const normalizePhoneNumber = (value = '') => {
  const compact = String(value).replace(/[^\d+]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('251')) return `+${compact}`;
  if (compact.startsWith('0')) return `+251${compact.slice(1)}`;
  return compact;
};

const hashPassword = (password) => bcrypt.hashSync(password, 10);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fullName, phone, password } = req.body;
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!fullName || !normalizedPhone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const database = await getDatabase();
    
    // Check if user exists
    const existing = await database.execute({
      sql: 'SELECT id FROM users WHERE phone = ?',
      args: [normalizedPhone]
    });
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'An account with this phone number already exists.' });
    }

    // Create user
    const passwordHash = hashPassword(password);
    const result = await database.execute({
      sql: 'INSERT INTO users (phone, password_hash, name, preferences) VALUES (?, ?, ?, ?)',
      args: [normalizedPhone, passwordHash, fullName, JSON.stringify({ role: 'student' })]
    });

    return res.status(201).json({ 
      message: 'Registration successful',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
}
