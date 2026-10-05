-- Custom auth table (no Supabase Auth module)
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  email TEXT,
  grade TEXT,
  school TEXT,
  profile_image_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  preferences JSONB NOT NULL DEFAULT '{"role":"student"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- Allow anon/auth roles to read/insert (adjust RLS as needed)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_all" ON public.users;
CREATE POLICY "users_select_all" ON public.users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "users_insert_all" ON public.users;
CREATE POLICY "users_insert_all" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "users_update_all" ON public.users;
CREATE POLICY "users_update_all" ON public.users FOR UPDATE TO anon, authenticated USING (true);
