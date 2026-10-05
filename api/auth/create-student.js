// Vercel Serverless Function for Create Student (Teacher Only)
// Uses Turso (LibSQL) for cloud SQLite database

import bcrypt from 'bcryptjs';
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

const normalizePhoneNumber = (value = '') => {
  const compact = String(value).replace(/[^\d+]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('251')) return `+${compact}`;
  if (compact.startsWith('0')) return `+251${compact.slice(1)}`;
  return compact;
};

const hashPassword = (password) => bcrypt.hashSync(password, 10);

const getBearerToken = (req) => {
  const header = req.headers.authorization ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
};

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
    
    // Check if requester is teacher or admin
    const teacherResult = await database.execute({
      sql: 'SELECT preferences FROM users WHERE id = ?',
      args: [decoded.sub]
    });

    if (!teacherResult.rows[0]) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const preferences = teacherResult.rows[0].preferences ? JSON.parse(teacherResult.rows[0].preferences) : {};
    const role = preferences.role || 'student';

    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers can create student accounts.' });
    }

    const { fullName, phone, password, stream } = req.body;
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!fullName || !normalizedPhone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if user exists
    const existing = await database.execute({
      sql: 'SELECT id FROM users WHERE phone = ?',
      args: [normalizedPhone]
    });
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'An account with this phone number already exists.' });
    }

    // Create student
    const passwordHash = hashPassword(password);
    const studentPreferences = { role: 'student', stream: stream || 'natural' };
    
    const result = await database.execute({
      sql: 'INSERT INTO users (phone, password_hash, name, preferences) VALUES (?, ?, ?, ?)',
      args: [normalizedPhone, passwordHash, fullName, JSON.stringify(studentPreferences)]
    });

    return res.status(201).json({ 
      message: 'Student account created successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('CREATE STUDENT ERROR:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
}
