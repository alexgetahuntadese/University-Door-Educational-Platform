// Vercel Serverless Function for Login
// Uses Turso (LibSQL) for cloud SQLite database

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Turso database connection
let db = null;

async function getDatabase() {
  if (db) return db;
  
  const { createClient } = await import('@libsql/client');
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  // Initialize schema
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

const verifyPassword = (password, hash) => bcrypt.compareSync(password, hash);

const buildUser = (row) => ({
  id: String(row.id),
  phone: row.phone,
  email: row.email ?? null,
  user_metadata: {
    name: row.name ?? null,
    mobile: row.phone,
  },
});

const buildProfile = (row) => ({
  id: String(row.id),
  auth_id: String(row.id),
  name: row.name ?? null,
  mobile: row.phone,
  email: row.email ?? null,
  phone: row.phone,
  grade: null,
  school: null,
  profile_image_url: null,
  date_of_birth: null,
  gender: null,
  preferences: row.preferences ? JSON.parse(row.preferences) : { role: 'student' },
  is_active: Boolean(row.is_active),
  created_at: row.created_at,
  updated_at: row.updated_at,
  last_login: row.last_login,
});

const buildAuthResponse = (row) => {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();
  const token = jwt.sign({ sub: String(row.id), phone: row.phone }, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
  return {
    token,
    session: { accessToken: token, expiresAt, user: buildUser(row) },
    profile: buildProfile(row),
  };
};

export default async function handler(req, res) {
  // Enable CORS
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
    const { phone, password } = req.body;
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!normalizedPhone || !password) {
      return res.status(400).json({ message: 'Enter your phone number and password.' });
    }

    const database = await getDatabase();
    
    const result = await database.execute({
      sql: 'SELECT * FROM users WHERE phone = ?',
      args: [normalizedPhone]
    });
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'No account was found for that phone number.' });
    }

    const passwordMatches = verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Incorrect phone number or password.' });
    }

    // Update last login
    await database.execute({
      sql: 'UPDATE users SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [user.id]
    });

    const updatedResult = await database.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [user.id]
    });

    return res.json(buildAuthResponse(updatedResult.rows[0]));
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
}
