// Setup script to create demo accounts in Turso
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const TURSO_URL = process.env.TURSO_URL
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing TURSO_URL or TURSO_AUTH_TOKEN environment variables')
  console.error('Please set these in your .env file')
  process.exit(1)
}

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
})

console.log('🔧 Connecting to Turso...')

// Initialize schema
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
  console.error('❌ Failed to initialize schema:', err)
  process.exit(1)
}

// Create demo teacher account
const phone = '+251911234567'
const password = 'demo123'
const name = 'Demo Teacher'
const email = 'teacher@demo.com'

const passwordHash = bcrypt.hashSync(password, 10)
const preferences = JSON.stringify({ role: 'teacher' })

try {
  const existing = await client.execute({
    sql: 'SELECT id FROM users WHERE phone = ?',
    args: [phone]
  })

  if (existing.rows.length > 0) {
    console.log('✅ Demo teacher account already exists')
    console.log('   Phone:', phone)
    console.log('   Password:', password)
  } else {
    await client.execute({
      sql: `INSERT INTO users (phone, password_hash, name, email, preferences, last_login)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [phone, passwordHash, name, email, preferences]
    })
    console.log('✅ Demo teacher account created successfully')
    console.log('   Phone:', phone)
    console.log('   Password:', password)
    console.log('   Name:', name)
  }

  // Create demo student account
  const studentPhone = '+251922345678'
  const studentPassword = 'student123'
  const studentName = 'Demo Student'
  const studentEmail = 'student@demo.com'
  const studentPreferences = JSON.stringify({ role: 'student', stream: 'natural' })

  const existingStudent = await client.execute({
    sql: 'SELECT id FROM users WHERE phone = ?',
    args: [studentPhone]
  })

  if (existingStudent.rows.length > 0) {
    console.log('✅ Demo student account already exists')
    console.log('   Phone:', studentPhone)
    console.log('   Password:', studentPassword)
  } else {
    const studentPasswordHash = bcrypt.hashSync(studentPassword, 10)
    await client.execute({
      sql: `INSERT INTO users (phone, password_hash, name, email, preferences, last_login)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [studentPhone, studentPasswordHash, studentName, studentEmail, studentPreferences]
    })
    console.log('✅ Demo student account created successfully')
    console.log('   Phone:', studentPhone)
    console.log('   Password:', studentPassword)
    console.log('   Name:', studentName)
  }

  console.log('\n📝 You can now sign in with these accounts')
  console.log('   Teacher: +251911234567 / demo123')
  console.log('   Student: +251922345678 / student123')
} catch (err) {
  console.error('❌ Error creating demo accounts:', err.message)
  process.exit(1)
}
