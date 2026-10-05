# Turso Deployment Guide

This guide will help you deploy the backend server using Turso (cloud SQLite). Turso is specifically designed for cloud SQLite with a generous free tier.

## Why Turso?

- ✅ **Free Tier**: 500MB storage, 8GB bandwidth/month
- ✅ **No Persistent Volume Needed**: Database is in the cloud
- ✅ **Edge Replication**: Fast access from anywhere
- ✅ **SQLite Compatible**: Same SQL as local SQLite
- ✅ **Built for Production**: Automatic backups, replication

## Step 1: Create Turso Database

1. Go to [turso.tech](https://turso.tech) and sign up/login
2. Click **"Create Database"**
3. Name it: `university-door-auth` (or any name you prefer)
4. Select a region closest to your users (e.g., `ams` for Amsterdam, `fra` for Frankfurt)
5. Click **"Create"**

## Step 2: Get Database Credentials

After creating the database, you'll see:

1. **Database URL**: Looks like `libsql://your-db-name.turso.io`
2. **Auth Token**: Click "Generate Token" to get one

Copy both values.

## Step 3: Set Environment Variables Locally

Create `server/.env` file:

```env
PORT=5000
JWT_SECRET=your-secret-key-here
CLIENT_ORIGIN=http://localhost:5174
TURSO_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

Generate JWT_SECRET:
```bash
openssl rand -base64 32
```

## Step 4: Install Dependencies

```bash
cd server
npm install
```

This will install `@libsql/client` (replaces better-sqlite3).

## Step 5: Setup Demo Accounts

```bash
cd server
npm run setup-demo
```

This will:
- Initialize the Turso database schema
- Create demo teacher and student accounts

## Step 6: Test Locally

```bash
cd server
npm start
```

The server should start and connect to Turso.

Test the login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+251911234567","password":"demo123"}'
```

## Step 7: Deploy to Vercel (Serverless Functions)

### Option A: Use Vercel Serverless Functions

1. Create `api/auth/[...path]/route.ts` in your project root
2. Import and use the Turso routes
3. Set environment variables in Vercel

### Option B: Deploy to Railway/Render (Recommended)

Deploy the Express server to Railway or Render:

#### Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repository
4. Set root directory to `server`
5. Add environment variables:
   - `JWT_SECRET`
   - `TURSO_URL`
   - `TURSO_AUTH_TOKEN`
   - `NODE_ENV=production`
6. Deploy

#### Render

1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repository
4. Root directory: `server`
5. Build Command: `npm install`
6. Start Command: `node src/index.js`
7. Add environment variables (same as Railway)
8. Deploy

## Step 8: Configure Vercel Frontend

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your deployed backend URL (e.g., `https://your-app.railway.app`)
4. Redeploy Vercel

## Step 9: Setup Demo Accounts on Production

After deploying, run the setup script:

**On Railway:**
1. Go to service → Console
2. Run:
```bash
cd server
node scripts/setup-turso.js
```

**On Render:**
1. Go to service → Shell
2. Run the same command

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `JWT_SECRET` | Yes | Secret for JWT tokens |
| `CLIENT_ORIGIN` | No | Frontend URL for CORS |
| `TURSO_URL` | Yes | Turso database URL |
| `TURSO_AUTH_TOKEN` | Yes | Turso authentication token |
| `NODE_ENV` | No | Set to `production` for production |

## Demo Accounts

After running setup:
- **Teacher**: `+251911234567` / `demo123`
- **Student**: `+251922345678` / `student123`

## Troubleshooting

### "Missing TURSO_URL or TURSO_AUTH_TOKEN"

Make sure you:
1. Created a Turso database
2. Copied the URL and auth token
3. Set them in environment variables

### "Failed to initialize schema"

Check:
1. TURSO_URL is correct
2. TURSO_AUTH_TOKEN is valid
3. Your Turso database is active

### "Cannot connect to Turso"

Verify:
1. Network connectivity
2. Turso database is not paused (free tier databases pause after inactivity)
3. Auth token is not expired

### Database is paused (Free Tier)

Free Turso databases pause after 7 days of inactivity. To wake up:
1. Go to Turso dashboard
2. Click on your database
3. Click "Resume" if paused
4. Or make a request to wake it up automatically

## Turso Free Tier Limits

- 500MB storage
- 8GB bandwidth/month
- 1,000 rows read/write per second
- Databases pause after 7 days of inactivity

## Backup Strategy

Turso automatically backs up your database. You can also:

1. Export data via Turso CLI:
```bash
turso db shell university-door-auth ".dump > backup.sql"
```

2. Use Turso dashboard to create snapshots

## Advantages Over Railway SQLite

| Feature | Turso | Railway SQLite |
|---------|-------|----------------|
| Free Tier | Yes (500MB) | Yes (1GB volume) |
| Auto Backup | Yes | Manual |
| Edge Replication | Yes | No |
| No Persistent Volume | Yes | Required |
| Scalability | High | Limited |
| Cost After Free | ~$3/mo | ~$5/mo |

## Migrating from Local SQLite

If you have data in local `auth.db`:

1. Export local data:
```bash
sqlite3 server/auth.db .dump > backup.sql
```

2. Import to Turso:
```bash
turso db shell university-door-auth < backup.sql
```

## Monitoring

Check your Turso database usage:
- Go to Turso dashboard
- Click on your database
- View metrics: storage, bandwidth, requests

## Next Steps

1. ✅ Create Turso database
2. ✅ Get credentials
3. ✅ Update environment variables
4. ✅ Install dependencies
5. ✅ Run setup script
6. ✅ Test locally
7. ✅ Deploy to Railway/Render
8. ✅ Configure Vercel
9. ✅ Setup demo accounts on production
10. ✅ Test the full flow
