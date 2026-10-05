// Run: node scripts/seed_admin.js "your_password"
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env or server/.env
import bcrypt from 'bcryptjs';

const email = 'abdella@mewada.com';
const password = process.argv[2] || 'admin123';
const hash = await bcrypt.hash(password, 10);
console.log('INSERT INTO public.users (phone, email, password_hash, name, grade, school, preferences, is_active) VALUES');
console.log(`('+251911111111', '${email}', '${hash}', 'Abdella Mewada', null, null, '{"role":"admin"}', true);`);
console.log('\n--- Or use this hash directly ---');
console.log(hash);
