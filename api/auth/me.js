// Vercel Serverless Function for Get Current User
// Uses Turso (LibSQL) for cloud SQLite database

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

let db = null;

async function getDatabase() {
  if (db) return db;
  
  const { createClient } = await import('@libsql/client');
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  return db;
}

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
  const token = jwt.sign({ sub: String(row.id), phone: row.phone }, JWT_SECRET, { expiresIn: '7d' });
  return {
    token,
    session: { accessToken: token, expiresAt: null, user: buildUser(row) },
    profile: buildProfile(row),
  };
};

const getBearerToken = (req) => {
  const header = req.headers.authorization ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    const database = await getDatabase();
    const result = await database.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [decoded.sub]
    });

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json(buildAuthResponse(result.rows[0]));
  } catch (error) {
    console.error('ME ERROR:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
}
