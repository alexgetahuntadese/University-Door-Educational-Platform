import pg from 'pg'
import fs from 'fs'
import path from 'path'

const DATABASE_URL = 'postgresql://postgres:.6Tbg3M9H%2B_xJ9%24@[2a05:d018:1b65:3002:9199:8c0b:9e38:384a]:5432/postgres'

const migrationFile = path.resolve('../supabase/migrations/20261005000000_custom_auth_table.sql')
const sql = fs.readFileSync(migrationFile, 'utf8')

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(sql)
  console.log('Migration applied successfully.')
} catch (err) {
  console.error('Error:', err.message)
} finally {
  await client.end()
}
