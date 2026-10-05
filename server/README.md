# University Door Auth Server

Simple SQLite-based authentication server for the University Door platform.

## Features

- ✅ **SQLite Database** - No external database required, data stored in `auth.db`
- ✅ **Phone + Password Auth** - Ethiopian phone number format support
- ✅ **JWT Tokens** - Secure session management
- ✅ **Role-based Access** - Teacher and Student roles
- ✅ **Payment Receipt Upload** - Support for payment verification
- ✅ **Zero Configuration** - Works out of the box with defaults

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Setup Demo Accounts

```bash
npm run setup-demo
```

This creates two demo accounts:
- **Teacher**: `+251911234567` / `demo123`
- **Student**: `+251922345678` / `student123`

### 3. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Configuration

Create a `.env` file in the `server` directory (optional):

```env
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
CLIENT_ORIGIN=http://localhost:5174
```

- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret key for JWT tokens (default: dev-secret)
- `CLIENT_ORIGIN`: Frontend URL for CORS (default: http://localhost:8080)

## API Endpoints

### Authentication

- `POST /api/auth/login` - Sign in with phone and password
- `POST /api/auth/register` - Register new account (disabled - teachers create students)
- `GET /api/auth/me` - Get current user session
- `PATCH /api/auth/me` - Update user profile
- `POST /api/auth/logout` - Sign out

### Teacher Endpoints

- `POST /api/auth/create-student` - Create student account (teacher only)

### Payment Endpoints

- `POST /api/payments/submit` - Submit payment receipt
- `GET /api/payments/submissions` - Get user's submissions
- `GET /api/payments/admin/submissions` - Get all submissions (admin)
- `PATCH /api/payments/verify/:id` - Verify/reject payment (admin)
- `GET /api/payments/status` - Get payment status

### Health Check

- `GET /api/health` - Server health check

## Database

The SQLite database is stored at `server/auth.db`. All data persists between server restarts.

### Schema

```sql
CREATE TABLE users (
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
```

## Security Notes

- **Production**: Always set a strong `JWT_SECRET` in your `.env` file
- **Phone Format**: Supports Ethiopian phone numbers (with +251 prefix or starting with 0)
- **Password Hashing**: Uses bcrypt with salt rounds of 10
- **JWT Expiration**: Tokens expire after 7 days

## Development

### Adding New Users

Use the setup script to create demo accounts, or use the teacher dashboard to create student accounts.

### Reset Database

Delete `server/auth.db` and run `npm run setup-demo` to start fresh.

## Deployment

For production deployment, see `../BACKEND_DEPLOYMENT.md` for options like Railway, Render, or Fly.io.

Make sure to:
1. Set a strong `JWT_SECRET` environment variable
2. Use a platform that supports persistent file storage for SQLite
3. Back up your `auth.db` file regularly
