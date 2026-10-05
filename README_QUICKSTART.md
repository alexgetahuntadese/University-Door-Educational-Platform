# University Door Educational Platform

A web-based educational application designed to provide high school students in Ethiopia with seamless access to study materials, practice exams, and subject resources.

## Tech Stack

- **Frontend**: Vite, React, TypeScript, shadcn-ui, Tailwind CSS
- **Backend**: Node.js, Express, SQLite
- **Authentication**: JWT tokens with phone + password
- **Hosting**: Vercel (frontend), Railway/Render (backend)

## Quick Start

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Setup Backend Server

```bash
cd server
npm install
npm run setup-demo
npm start
```

This creates demo accounts:
- **Teacher**: `+251911234567` / `demo123`
- **Student**: `+251922345678` / `student123`

### 3. Start Frontend

```bash
npm run dev
```

The app will be available at `http://localhost:5174`

## Backend Server

The backend uses SQLite for zero-configuration local development. See [server/README.md](server/README.md) for details.

### Features

- ✅ SQLite database (no external DB required)
- ✅ Phone + password authentication
- ✅ JWT token sessions
- ✅ Teacher and Student roles
- ✅ Payment receipt uploads
- ✅ Zero configuration setup

### API Endpoints

- `POST /api/auth/login` - Sign in
- `POST /api/auth/create-student` - Create student (teacher only)
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile
- `POST /api/payments/submit` - Submit payment receipt

## Development

### Project Structure

```
/
├── src/                 # Frontend source code
├── server/              # Backend server (Express + SQLite)
├── public/              # Static assets
└── supabase/            # Supabase functions (optional)
```

### Environment Variables

Create `.env` in the root directory:

```env
VITE_API_BASE_URL=/api
```

For backend, create `server/.env`:

```env
PORT=5000
JWT_SECRET=your-secret-key
CLIENT_ORIGIN=http://localhost:5174
```

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

### Backend (Railway/Render)

See [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md) for detailed instructions.

**Important**: Set `VITE_API_BASE_URL` in Vercel to your deployed backend URL.

## Authentication

The app uses a local SQLite backend for authentication. Public registration is disabled - teachers create student accounts through the dashboard.

### Demo Accounts

- **Teacher**: `+251911234567` / `demo123`
- **Student**: `+251922345678` / `student123`

## Troubleshooting

### "Backend server is not running"

Start the backend server:
```bash
cd server
npm install
npm run setup-demo
npm start
```

### "Empty response from server"

Ensure the backend is running on port 5000 and accessible.

### Build fails

Check that all files are complete and no syntax errors exist.

## License

Proprietary - University Door Educational Platform
