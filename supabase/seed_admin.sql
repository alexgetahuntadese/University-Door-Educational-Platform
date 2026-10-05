-- Run this AFTER creating the auth user abdella@mewada.com in Supabase Dashboard > Authentication > Users
-- Replace the email and set grade/school as needed.

insert into public.users (auth_id, email, name, mobile, grade, school, preferences, is_active)
select id, email, 'Abdella Mewada', '', null, null, jsonb_build_object('role', 'admin'), true
from auth.users
where email = 'abdella@mewada.com'
on conflict (auth_id) do update
set email = excluded.email,
    name = excluded.name,
    preferences = excluded.preferences,
    updated_at = now();
