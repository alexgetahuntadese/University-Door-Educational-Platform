# Backend Deployment Guide

The backend uses SQLite with file-based storage. For production deployment, you need a platform that supports persistent file storage.

## Option 1: Railway (Recommended for SQLite)

Railway supports persistent volumes for SQLite databases.

### Steps:
1. Go to [railway.app](https://railway.app) and sign up
2. Create a new project
3. Deploy from GitHub repository
4. Select the `server` folder as the root directory
5. Add environment variable:
   - `JWT_SECRET`: Generate a random secret
6. Railway will automatically detect the Node.js app and deploy
7. Add a persistent volume for the `server` directory to persist auth.db

### Railway will provide a URL like: `https://your-app.railway.app`

## Option 2: Render

Render supports disk storage for paid plans.

### Steps:
1. Go to [render.com](https://render.com) and sign up
2. Create a new Web Service
3. Connect your GitHub repository
4. Set Root Directory to `server`
5. Build Command: `npm install`
6. Start Command: `node src/index.js`
7. Add environment variable:
   - `JWT_SECRET`: Generate a random secret
8. For persistent storage, you need a paid plan with disk support

## Option 3: Fly.io

Fly.io supports persistent volumes.

### Steps:
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. From the server directory:
   ```bash
   fly launch
   fly volume create auth-data --size 1GB
   fly deploy
   ```
4. Add environment variable:
   - `JWT_SECRET`: Generate a random secret

## Option 4: DigitalOcean App Platform

DigitalOcean supports persistent storage.

### Steps:
1. Go to [digitalocean.com](https://digitalocean.com)
2. Create an App
3. Connect GitHub repository
4. Set Root Directory to `server`
5. Add a persistent volume mount
6. Add environment variable:
   - `JWT_SECRET`: Generate a random secret

## Important Notes

### Database Persistence
- The SQLite database (`auth.db`) is stored in the `server` directory
- **Must** configure persistent storage on your platform
- Without persistent storage, data will be lost on redeploy

### Environment Variables Required
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (platforms usually set this automatically)
- `NODE_ENV`: Set to `production`

### Frontend Configuration
After deploying the backend, update Vercel environment variable:
- `VITE_API_BASE_URL`: Set to your backend URL (e.g., `https://your-backend.railway.app`)

### Local Development
Keep using the local server for development:
```bash
cd server
npm install
npm start
```

The frontend will proxy `/api` requests to `http://localhost:5000`

## Backup Strategy

Since SQLite is file-based, you should:
1. Regularly export the database:
   ```bash
   sqlite3 server/auth.db .dump > backup.sql
   ```
2. Store backups in a safe location
3. Consider migrating to Turso (cloud SQLite) for better backup and scaling
