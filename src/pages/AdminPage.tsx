import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AdminPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !email || !password) {
      toast.error('Name, email and password are required');
      return;
    }
    setLoading(true);
    try {
      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      const { error } = await supabase.from('users').insert({
        phone: phone || email,
        email,
        password_hash: hashed,
        name,
        grade: grade || null,
        school: school || null,
        preferences: { role },
        is_active: true,
      });

      if (error) throw error;

      toast.success(`${role} account created for ${email}`);
      setName(''); setEmail(''); setPhone(''); setGrade(''); setSchool(''); setPassword('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Admin Dashboard</CardTitle>
          <CardDescription className="text-white/70">Create teacher or student accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'teacher' | 'student')}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white">Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Grade</Label>
            <Input value={grade} onChange={(e) => setGrade(e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">School</Label>
            <Input value={school} onChange={(e) => setSchool(e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/10 border-white/20 text-white" />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold">
            {loading ? 'Creating...' : `Create ${role}`}
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full border-white/30 text-white">Back</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
