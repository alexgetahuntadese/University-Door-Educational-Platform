// Setup script to create a demo teacher account
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, '..', 'auth.db')
const db = new Database(dbPath)

// Initialize schema
const initSchema = `
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
`
db.exec(initSchema)

// Create demo teacher account
const phone = '+251911234567'
const password = 'demo123'
const name = 'Demo Teacher'
const email = 'teacher@demo.com'

const passwordHash = bcrypt.hashSync(password, 10)
const preferences = JSON.stringify({ role: 'teacher' })

try {
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
  if (existing) {
    console.log('✅ Demo teacher account already exists')
    console.log('   Phone:', phone)
    console.log('   Password:', password)
  } else {
    const insert = db.prepare(`
      INSERT INTO users (phone, password_hash, name, email, preferences, last_login)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    insert.run(phone, passwordHash, name, email, preferences)
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

  const existingStudent = db.prepare('SELECT id FROM users WHERE phone = ?').get(studentPhone)
  if (existingStudent) {
    console.log('✅ Demo student account already exists')
    console.log('   Phone:', studentPhone)
    console.log('   Password:', studentPassword)
  } else {
    const studentPasswordHash = bcrypt.hashSync(studentPassword, 10)
    const insertStudent = db.prepare(`
      INSERT INTO users (phone, password_hash, name, email, preferences, last_login)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    insertStudent.run(studentPhone, studentPasswordHash, studentName, studentEmail, studentPreferences)
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
} finally {
  db.close()
}
