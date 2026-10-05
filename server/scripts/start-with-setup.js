// Startup script that runs auto-setup then starts the server
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function main() {
  console.log('🚀 Starting server with auto-setup...')

  try {
    // Run auto-setup
    console.log('🔧 Running auto-setup...')
    await execAsync('node scripts/auto-setup.js')
    console.log('✅ Auto-setup completed')
  } catch (err) {
    console.error('❌ Auto-setup failed:', err.message)
    // Continue anyway - setup might have already run
  }

  // Start the server
  console.log('🌐 Starting server...')
  await execAsync('node src/index.js')
}

main().catch((err) => {
  console.error('❌ Startup failed:', err)
  process.exit(1)
})
