# Railway Deployment Guide

This guide will help you deploy the backend server to Railway.

## Prerequisites

- GitHub account with your repository pushed
- Railway account (free tier available)

## Step 1: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Click **"Add Service"** → **"Existing Dockerfile"** or **"Start with CI"**
5. Select the `server` folder as the root directory

## Step 2: Configure Service Settings

### Root Directory
- Set to: `server`

### Build Command
- Leave empty (Railway will auto-detect)
- Or set: `npm install`

### Start Command
- Set to: `node src/index.js`

## Step 3: Add Environment Variables

In Railway, go to your service → **Variables** and add:

```
JWT_SECRET=your-random-secret-here
NODE_ENV=production
```

**Important**: Generate a secure JWT_SECRET:
```bash
openssl rand -base64 32
```

## Step 4: Add Persistent Volume

This is critical for SQLite to persist data between deployments.

1. Go to your service → **Settings** → **Volumes**
2. Click **"New Volume"**
3. Settings:
   - **Name**: `auth-data`
   - **Mount Path**: `/app/server`
4. Click **"Create"**

This ensures the `auth.db` file persists.

## Step 5: Initialize Demo Accounts

After deployment, you need to create the demo accounts. Choose one method:

### Method A: Railway Console (Recommended)

1. Go to your service in Railway
2. Click **"Console"** tab
3. Click **"New Console"**
4. Run:
```bash
cd server
node scripts/auto-setup.js
```

### Method B: Add Startup Script

Edit `server/package.json` and add:

```json
"scripts": {
  "start": "node scripts/auto-setup.js && node src/index.js"
}
```

Then redeploy.

## Step 6: Get Your Backend URL

Railway will provide a URL like:
```
https://your-app-name.up.railway.app
```

Copy this URL.

## Step 7: Configure Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your Railway URL (e.g., `https://your-app-name.up.railway.app`)
   - **Important**: No trailing slash
4. Add for all environments (Production, Preview, Development)
5. Click **"Save"**
6. Redeploy your Vercel project

## Step 8: Test

1. Wait for both Railway and Vercel to finish deploying
2. Open your Vercel URL
3. Try to sign in with:
   - Phone: `+251911234567`
   - Password: `demo123`

## Troubleshooting

### "Database locked" or "auth.db not found"

Ensure you:
1. Added the persistent volume
2. Set the mount path to `/app/server`
3. Ran the auto-setup script after deployment

### "Cannot connect to backend"

Check:
1. Vercel environment variable `VITE_API_BASE_URL` is set correctly
2. No trailing slash in the URL
3. Railway service is running (check logs)

### "Empty response from server"

This means the backend is not accessible. Verify:
1. Railway service is deployed and running
2. VITE_API_BASE_URL is set in Vercel
3. CORS is configured correctly (should work with origin: true)

### Demo accounts don't work

Run the auto-setup script in Railway console:
```bash
cd server
node scripts/auto-setup.js
```

## Railway Free Tier Limits

- $5/month free credit
- Persistent volumes: 1GB free
- After free credit, Railway costs ~$5/month

## Alternative: Render

If Railway doesn't work, try Render (render.com):
- Render has a free tier for web services
- Persistent storage requires paid plan ($7/month)
- Similar setup process

## Backup Strategy

Since SQLite is file-based, regularly back up `auth.db`:

1. Connect to Railway console
2. Run:
```bash
cd server
cp auth.db auth.db.backup
```

Or download the file from Railway periodically.
