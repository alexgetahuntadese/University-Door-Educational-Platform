// Payment receipt handling for Turso auth server (base64 only, no file storage)
import express from 'express'
import jwt from 'jsonwebtoken'
import { createClient } from '@libsql/client'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'

// Connect to Turso
const TURSO_URL = process.env.TURSO_URL
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing TURSO_URL or TURSO_AUTH_TOKEN in payments module')
  process.exit(1)
}

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
})

// Create payments table
try {
  const createPaymentsTable = `
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      transaction_ref TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      receipt_base64 TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      verified_at TEXT,
      reviewer_notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `

  const createPaymentUserIndex = `CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id)`
  const createPaymentStatusIndex = `CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`

  await client.execute(createPaymentsTable)
  await client.execute(createPaymentUserIndex)
  await client.execute(createPaymentStatusIndex)
  console.log('✅ Payments table initialized in Turso')
} catch (err) {
  console.error('❌ Failed to initialize payments table:', err)
}

export const uploadRouter = express.Router()

// JWT middleware for payments
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.sub
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// Submit payment with receipt (base64 stored in database)
uploadRouter.post('/submit', requireAuth, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, transactionRef, paymentMethod, receiptBase64 } = req.body

    if (!amount || !bankName || !accountNumber || !transactionRef || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields.' })
    }

    await client.execute({
      sql: `INSERT INTO payments (user_id, amount, bank_name, account_number, transaction_ref, payment_method, receipt_base64)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [req.userId, parseFloat(amount), bankName, accountNumber, transactionRef, paymentMethod, receiptBase64 || null]
    })

    res.json({ message: 'Payment submitted successfully' })
  } catch (err) {
    console.error('Payment submission error:', err)
    res.status(500).json({ message: 'Failed to submit payment.' })
  }
})

// Get user's submissions
uploadRouter.get('/submissions', requireAuth, async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT id, user_id, amount, bank_name, account_number, transaction_ref, payment_method, status, submitted_at, verified_at, reviewer_notes FROM payments WHERE user_id = ? ORDER BY submitted_at DESC',
      args: [req.userId]
    })
    res.json(result.rows)
  } catch (err) {
    console.error('Get submissions error:', err)
    res.status(500).json({ message: 'Failed to load submissions.' })
  }
})

// Admin: Get all submissions
uploadRouter.get('/admin/submissions', requireAuth, async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT id, user_id, amount, bank_name, account_number, transaction_ref, payment_method, status, submitted_at, verified_at, reviewer_notes FROM payments ORDER BY submitted_at DESC',
      args: []
    })
    res.json(result.rows)
  } catch (err) {
    console.error('Get all submissions error:', err)
    res.status(500).json({ message: 'Failed to load submissions.' })
  }
})

// Admin: Verify or reject payment
uploadRouter.patch('/verify/:id', requireAuth, async (req, res) => {
  try {
    const { status, reviewerNotes } = req.body
    const { id } = req.params

    if (status !== 'verified' && status !== 'rejected') {
      return res.status(400).json({ message: 'Invalid status.' })
    }

    await client.execute({
      sql: 'UPDATE payments SET status = ?, verified_at = CURRENT_TIMESTAMP, reviewer_notes = ? WHERE id = ?',
      args: [status, reviewerNotes || null, id]
    })

    res.json({ message: `Payment ${status} successfully` })
  } catch (err) {
    console.error('Verify payment error:', err)
    res.status(500).json({ message: 'Failed to update payment status.' })
  }
})

// Get user's payment status
uploadRouter.get('/status', requireAuth, async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT status FROM payments WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1',
      args: [req.userId]
    })

    if (result.rows.length === 0) {
      return res.json({ hasPayment: false, status: null })
    }

    res.json({ hasPayment: true, status: result.rows[0].status })
  } catch (err) {
    console.error('Get payment status error:', err)
    res.status(500).json({ message: 'Failed to get payment status.' })
  }
})

// Get receipt base64 for viewing
uploadRouter.get('/receipt/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const result = await client.execute({
      sql: 'SELECT receipt_base64 FROM payments WHERE id = ? AND user_id = ?',
      args: [id, req.userId]
    })

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Receipt not found' })
    }

    res.json({ receiptBase64: result.rows[0].receipt_base64 })
  } catch (err) {
    console.error('Get receipt error:', err)
    res.status(500).json({ message: 'Failed to get receipt.' })
  }
})

export const receiptStaticPath = null // No static file serving for Turso
