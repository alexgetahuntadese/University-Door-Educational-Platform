// Auto-setup script - runs on server startup to ensure demo accounts exist
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, '..', 'auth.db')

console.log('🔧 Running auto-setup...')

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
const teacherPhone = '+251911234567'
const teacherPassword = 'demo123'
const teacherName = 'Demo Teacher'
const teacherEmail = 'teacher@demo.com'

const teacherPasswordHash = bcrypt.hashSync(teacherPassword, 10)
const teacherPreferences = JSON.stringify({ role: 'teacher' })

try {
  const existingTeacher = db.prepare('SELECT id FROM users WHERE phone = ?').get(teacherPhone)
  if (!existingTeacher) {
    const insert = db.prepare(`
      INSERT INTO users (phone, password_hash, name, email, preferences, last_login)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    insert.run(teacherPhone, teacherPasswordHash, teacherName, teacherEmail, teacherPreferences)
    console.log('✅ Demo teacher account created')
  } else {
    console.log('✅ Demo teacher account already exists')
  }

  // Create demo student account
  const studentPhone = '+251922345678'
  const studentPassword = 'student123'
  const studentName = 'Demo Student'
  const studentEmail = 'student@demo.com'
  const studentPreferences = JSON.stringify({ role: 'student', stream: 'natural' })

  const existingStudent = db.prepare('SELECT id FROM users WHERE phone = ?').get(studentPhone)
  if (!existingStudent) {
    const studentPasswordHash = bcrypt.hashSync(studentPassword, 10)
    const insertStudent = db.prepare(`
      INSERT INTO users (phone, password_hash, name, email, preferences, last_login)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    insertStudent.run(studentPhone, studentPasswordHash, studentName, studentEmail, studentPreferences)
    console.log('✅ Demo student account created')
  } else {
    console.log('✅ Demo student account already exists')
  }

  console.log('📝 Demo accounts ready:')
  console.log('   Teacher: +251911234567 / demo123')
  console.log('   Student: +251922345678 / student123')
} catch (err) {
  console.error('❌ Auto-setup error:', err.message)
} finally {
  db.close()
}
