# Supabase Setup Guide

This guide will help you set up Supabase as your authentication and database backend.

## Why Supabase?

- ✅ **Free Tier**: 500MB database, 1GB storage, 2GB bandwidth/month
- ✅ **Built-in Auth**: Email/password, phone, OAuth providers
- ✅ **Real-time**: Real-time subscriptions
- ✅ **No Backend Needed**: Supabase handles auth and database
- ✅ **Easy Deployment**: Just add environment variables to Vercel

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Enter project details:
   - **Name**: `university-door-auth`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for project to be created (1-2 minutes)

## Step 2: Get Supabase Credentials

After project creation, you'll see:

1. **Project URL**: Looks like `https://your-project-id.supabase.co`
2. **Anon Key**: Found in Settings → API

Copy both values.

## Step 3: Run Database Migrations

The project includes Supabase migrations. Run them:

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

Or manually run the SQL from `supabase/migrations/` in the Supabase SQL Editor.

## Step 4: Set Environment Variables Locally

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

## Step 5: Create Demo Accounts

In Supabase SQL Editor, run:

```sql
-- Create teacher account
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('+251911234567@university-door.local', 'hash-of-demo123', NOW());

-- Get the user ID from the above insert
-- Then create profile
INSERT INTO profiles (id, auth_id, name, phone, mobile, email, preferences, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = '+251911234567@university-door.local'),
  (SELECT id FROM auth.users WHERE email = '+251911234567@university-door.local'),
  'Demo Teacher',
  '+251911234567',
  '+251911234567',
  '+251911234567@university-door.local',
  '{"role": "teacher"}',
  true
);

-- Create student account
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('+251922345678@university-door.local', 'hash-of-student123', NOW());

INSERT INTO profiles (id, auth_id, name, phone, mobile, email, preferences, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = '+251922345678@university-door.local'),
  (SELECT id FROM auth.users WHERE email = '+251922345678@university-door.local'),
  'Demo Student',
  '+251922345678',
  '+251922345678',
  '+251922345678@university-door.local',
  '{"role": "student"}',
  true
);
```

**Note**: You'll need to hash the passwords properly using Supabase's auth API or use the Supabase dashboard to create users.

## Step 6: Test Locally

```bash
npm run dev
```

Try logging in with demo accounts (you'll need to create them first in Supabase).

## Step 7: Deploy to Vercel

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Key**: `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - **Value**: Your Supabase anon key
4. Redeploy Vercel

## Step 8: Configure Row Level Security (RLS)

In Supabase SQL Editor, enable RLS for profiles:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to insert their profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Supabase anon/public key |

## Demo Accounts

After setup:
- **Teacher**: `+251911234567` / `demo123`
- **Student**: `+251922345678` / `student123`

## Troubleshooting

### "Missing Supabase environment variables"

Make sure you:
1. Created a Supabase project
2. Copied the URL and anon key
3. Set them in environment variables
4. Restarted your dev server

### "Auth failed"

Check:
1. User exists in Supabase auth.users table
2. Profile exists in profiles table
3. Password is correct
4. Email format is correct (phone@university-door.local)

### "Profile not found"

Make sure:
1. You ran the migrations
2. Profile was created after user signup
3. RLS policies allow reading profiles

## Advantages Over Custom Backend

| Feature | Supabase | Custom Backend |
|---------|----------|----------------|
| Free Tier | Yes (500MB) | Depends on platform |
| Built-in Auth | Yes | Manual implementation |
| Real-time | Yes | Requires WebSocket |
| No Backend Deploy | Yes | Railway/Render needed |
| Admin Dashboard | Yes | Manual setup |
| Row Level Security | Yes | Manual implementation |

## Next Steps

1. ✅ Create Supabase project
2. ✅ Get credentials
3. ✅ Run migrations
4. ✅ Set environment variables
5. ✅ Create demo accounts
6. ✅ Test locally
7. ✅ Deploy to Vercel
8. ✅ Configure RLS
9. ✅ Test production
