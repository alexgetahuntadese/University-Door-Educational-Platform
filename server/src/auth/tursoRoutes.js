// Turso-based auth for cloud SQLite
// Uses Turso libSQL for cloud-hosted SQLite database

import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@libsql/client'

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

// Initialize Turso client
const TURSO_URL = process.env.TURSO_URL
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing TURSO_URL or TURSO_AUTH_TOKEN environment variables')
  console.error('Please set these in your environment or .env file')
  process.exit(1)
}

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
})

console.log('✅ Turso client initialized')

// Create tables
const createTable = `
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
  )
`

const createIndex = `CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`

try {
  await client.execute(createTable)
  await client.execute(createIndex)
  console.log('✅ Turso database schema initialized')
} catch (err) {
  console.error('❌ Failed to initialize Turso schema:', err)
}

// Helper functions
const normalizePhoneNumber = (value = '') => {
  const compact = String(value).replace(/[^\d+]/g, '')
  if (!compact) return ''
  if (compact.startsWith('+')) return compact
  if (compact.startsWith('251')) return `+${compact}`
  if (compact.startsWith('0')) return `+251${compact.slice(1)}`
  return compact
}

const hashPassword = (password) => bcrypt.hashSync(password, 10)
const verifyPassword = (password, hash) => bcrypt.compareSync(password, hash)

const buildUser = (row) => ({
  id: String(row.id),
  phone: row.phone,
  email: row.email ?? null,
  user_metadata: {
    name: row.name ?? null,
    mobile: row.phone,
  },
})

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
})

const buildAuthResponse = (row) => {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString()
  const token = jwt.sign({ sub: String(row.id), phone: row.phone }, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS })
  return {
    token,
    session: { accessToken: token, expiresAt, user: buildUser(row) },
    profile: buildProfile(row),
  }
}

const getBearerToken = (request) => {
  const header = request.headers.authorization ?? ''
  if (!header.toLowerCase().startsWith('bearer ')) return ''
  return header.slice(7).trim()
}

const requireAuth = async (request, response, next) => {
  const token = getBearerToken(request)
  if (!token) return response.status(401).json({ message: 'Authentication required.' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const result = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [decoded.sub]
    })
    const user = result.rows[0]
    if (!user) return response.status(401).json({ message: 'User not found.' })
    request.authUser = user
    next()
  } catch (err) {
    return response.status(401).json({ message: 'Your session is no longer valid. Sign in again.' })
  }
}

const requireTeacher = async (request, response, next) => {
  const token = getBearerToken(request)
  if (!token) return response.status(401).json({ message: 'Authentication required.' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const result = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [decoded.sub]
    })
    const user = result.rows[0]
    if (!user) return response.status(401).json({ message: 'User not found.' })

    const preferences = user.preferences ? JSON.parse(user.preferences) : { role: 'student' }
    const role = preferences.role || 'student'

    if (role !== 'teacher' && role !== 'admin') {
      return response.status(403).json({ message: 'Teacher or admin access required.' })
    }

    request.authUser = user
    next()
  } catch (err) {
    return response.status(401).json({ message: 'Your session is no longer valid. Sign in again.' })
  }
}

// Routes
router.post('/register', (req, res) => {
  return res.status(403).json({ message: 'Public registration is disabled. Please contact your teacher to create an account.' })
})

router.post('/login', async (req, res) => {
  try {
    const phone = normalizePhoneNumber(req.body.phone)
    const password = typeof req.body.password === 'string' ? req.body.password : ''

    if (!phone || !password) return res.status(400).json({ message: 'Enter your phone number and password.' })

    const result = await client.execute({
      sql: 'SELECT * FROM users WHERE phone = ?',
      args: [phone]
    })
    const user = result.rows[0]

    if (!user) return res.status(401).json({ message: 'No account was found for that phone number.' })

    const passwordMatches = verifyPassword(password, user.password_hash)
    if (!passwordMatches) return res.status(401).json({ message: 'Incorrect phone number or password.' })

    await client.execute({
      sql: 'UPDATE users SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [user.id]
    })

    const updatedResult = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [user.id]
    })
    const updatedUser = updatedResult.rows[0]

    return res.json(buildAuthResponse(updatedUser))
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return res.status(500).json({ message: 'Server error: ' + err.message })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  return res.json(buildAuthResponse(req.authUser))
})

router.patch('/me', requireAuth, async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const emailRaw = typeof req.body.email === 'string' ? req.body.email.trim() : ''
  const email = emailRaw || null

  if (!name) return res.status(400).json({ message: 'Enter your full name.' })

  await client.execute({
    sql: 'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [name, email, req.authUser.id]
  })

  const updated = await client.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [req.authUser.id]
  })
  return res.json(buildAuthResponse(updated.rows[0]))
})

router.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

router.post('/create-student', requireTeacher, async (req, res) => {
  try {
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : ''
    const phone = normalizePhoneNumber(req.body.phone)
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const stream = typeof req.body.stream === 'string' ? req.body.stream.trim() : ''

    if (!fullName) return res.status(400).json({ message: 'Enter the student\'s full name.' })
    if (!phone) return res.status(400).json({ message: 'Enter a valid phone number.' })
    if (password.length < 6) return res.status(400).json({ message: 'Use a password with at least 6 characters.' })
    if (!stream || (stream !== 'natural' && stream !== 'social')) {
      return res.status(400).json({ message: 'Stream must be either "natural" or "social".' })
    }

    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE phone = ?',
      args: [phone]
    })
    if (existing.rows.length > 0) return res.status(409).json({ message: 'That phone number is already registered.' })

    const passwordHash = hashPassword(password)
    const preferences = JSON.stringify({ role: 'student', stream })

    const result = await client.execute({
      sql: `INSERT INTO users (phone, password_hash, name, preferences, last_login)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [phone, passwordHash, fullName, preferences]
    })

    const user = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [result.lastInsertRowid]
    })
    return res.status(201).json(buildAuthResponse(user.rows[0]))
  } catch (err) {
    console.error('CREATE STUDENT ERROR:', err)
    return res.status(500).json({ message: 'Server error: ' + err.message })
  }
})

export default router
