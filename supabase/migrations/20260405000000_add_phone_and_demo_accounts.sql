-- Add phone column to users table
alter table public.users add column if not exists phone text;

-- Create demo teacher account
-- Note: This will be created through Supabase Auth, then synced to users table by trigger
-- The trigger handle_auth_user_synced will automatically create the user profile

-- Enable public signup (for demo purposes)
-- In production, you might want to disable this and create accounts manually
