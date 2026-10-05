import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Search, Filter, TrendingUp, TrendingDown, BookOpen, CheckCircle, XCircle, ArrowLeft, Plus } from 'lucide-react';
import TopBar from '@/components/TopBar';
import StarField from '@/components/StarField';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';

// Data structure for student progress
interface StudentSubjectPerformance {
  subject: string;
  correct: number;
  missed: number;
  total: number;
}

interface StudentProgress {
  id: string;
  name: string;
  stream: 'natural' | 'social';
  grade: string;
  subjects: StudentSubjectPerformance[];
  totalCorrect: number;
  totalMissed: number;
  totalQuestions: number;
  lastActivity: string;
}

// Mock student data
const mockStudents: StudentProgress[] = [
  {
    id: '1',
    name: 'Abebe Kebede',
    stream: 'natural',
    grade: 'Grade 12',
    lastActivity: '2 hours ago',
    subjects: [
      { subject: 'Mathematics', correct: 45, missed: 15, total: 60 },
      { subject: 'Physics', correct: 38, missed: 22, total: 60 },
      { subject: 'Chemistry', correct: 42, missed: 18, total: 60 },
      { subject: 'Biology', correct: 50, missed: 10, total: 60 },
      { subject: 'English', correct: 35, missed: 25, total: 60 },
      { subject: 'Civics', correct: 48, missed: 12, total: 60 },
    ],
    totalCorrect: 258,
    totalMissed: 102,
    totalQuestions: 360,
  },
  {
    id: '2',
    name: 'Tigist Haile',
    stream: 'social',
    grade: 'Grade 11',
    lastActivity: '5 hours ago',
    subjects: [
      { subject: 'Mathematics', correct: 40, missed: 20, total: 60 },
      { subject: 'English', correct: 48, missed: 12, total: 60 },
      { subject: 'History', correct: 52, missed: 8, total: 60 },
      { subject: 'Geography', correct: 45, missed: 15, total: 60 },
      { subject: 'Economics', correct: 38, missed: 22, total: 60 },
      { subject: 'Civics', correct: 50, missed: 10, total: 60 },
    ],
    totalCorrect: 273,
    totalMissed: 87,
    totalQuestions: 360,
  },
  {
    id: '3',
    name: 'Dawit Alemu',
    stream: 'natural',
    grade: 'Grade 10',
    lastActivity: '1 day ago',
    subjects: [
      { subject: 'Mathematics', correct: 30, missed: 30, total: 60 },
      { subject: 'Physics', correct: 25, missed: 35, total: 60 },
      { subject: 'Chemistry', correct: 35, missed: 25, total: 60 },
      { subject: 'Biology', correct: 40, missed: 20, total: 60 },
      { subject: 'English', correct: 28, missed: 32, total: 60 },
      { subject: 'Civics', correct: 42, missed: 18, total: 60 },
    ],
    totalCorrect: 200,
    totalMissed: 160,
    totalQuestions: 360,
  },
  {
    id: '4',
    name: 'Sara Tekle',
    stream: 'social',
    grade: 'Grade 9',
    lastActivity: '3 days ago',
    subjects: [
      { subject: 'Mathematics', correct: 55, missed: 5, total: 60 },
      { subject: 'English', correct: 52, missed: 8, total: 60 },
      { subject: 'History', correct: 48, missed: 12, total: 60 },
      { subject: 'Geography', correct: 50, missed: 10, total: 60 },
      { subject: 'Economics', correct: 45, missed: 15, total: 60 },
      { subject: 'Civics', correct: 55, missed: 5, total: 60 },
    ],
    totalCorrect: 305,
    totalMissed: 55,
    totalQuestions: 360,
  },
  {
    id: '5',
    name: 'Kifle Yohannes',
    stream: 'natural',
    grade: 'Grade 12',
    lastActivity: '1 week ago',
    subjects: [
      { subject: 'Mathematics', correct: 20, missed: 40, total: 60 },
      { subject: 'Physics', correct: 18, missed: 42, total: 60 },
      { subject: 'Chemistry', correct: 22, missed: 38, total: 60 },
      { subject: 'Biology', correct: 25, missed: 35, total: 60 },
      { subject: 'English', correct: 30, missed: 30, total: 60 },
      { subject: 'Civics', correct: 35, missed: 25, total: 60 },
    ],
    totalCorrect: 150,
    totalMissed: 210,
    totalQuestions: 360,
  },
];

const TeachersDashboard = () => {
  const navigate = useNavigate();
  const { isTeacher, isLoading, session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStream, setFilterStream] = useState<'all' | 'natural' | 'social'>('all');
  const [filterGrade, setFilterGrade] = useState<'all' | '9' | '10' | '11' | '12'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ fullName: '', phone: '', password: '', stream: 'natural' as 'natural' | 'social', role: 'student' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  
  // Super admin email who can create teachers
  const SUPER_ADMIN_EMAIL = 'abdella@mewada.com';
  const isSuperAdmin = session?.user?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (!isLoading && !isTeacher) {
      navigate('/login');
    }
  }, [isTeacher, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const filteredStudents = useMemo(() => {
    return mockStudents.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStream = filterStream === 'all' || student.stream === filterStream;
      const matchesGrade = filterGrade === 'all' || student.grade === `Grade ${filterGrade}`;
      return matchesSearch && matchesStream && matchesGrade;
    });
  }, [searchQuery, filterStream, filterGrade]);

  const overallStats = useMemo(() => {
    const totalStudents = mockStudents.length;
    const avgCorrect = Math.round(mockStudents.reduce((sum, s) => sum + s.totalCorrect, 0) / totalStudents);
    const avgMissed = Math.round(mockStudents.reduce((sum, s) => sum + s.totalMissed, 0) / totalStudents);
    const naturalCount = mockStudents.filter(s => s.stream === 'natural').length;
    const socialCount = mockStudents.filter(s => s.stream === 'social').length;
    
    return { totalStudents, avgCorrect, avgMissed, naturalCount, socialCount };
  }, []);

  const getStreamColor = (stream: string) => {
    return stream === 'natural' ? 'from-emerald-500 to-teal-600' : 'from-purple-500 to-pink-600';
  };

  const getStreamBadge = (stream: string) => {
    return stream === 'natural' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  };

  const getPercentage = (correct: number, total: number) => {
    return Math.round((correct / total) * 100);
  };

  const handleCreate = async () => {
    if (!newStudent.fullName || !newStudent.phone || !newStudent.password) {
      setCreateError('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const hashed = await bcrypt.hash(newStudent.password, 10);
      
      // Super admin can create both teachers and students
      // Regular teachers can only create students
      let preferences;
      if (isSuperAdmin) {
        preferences = { role: newStudent.role };
      } else {
        preferences = { role: 'student' };
      }

      const { error } = await supabase.from('users').insert({
        phone: newStudent.phone,
        email: null,
        password_hash: hashed,
        name: newStudent.fullName,
        grade: null,
        school: null,
        preferences,
        is_active: true,
      });

      if (error) {
        if (error.message.includes('users_phone_key') || error.message.includes('duplicate')) {
          throw new Error('A user with that phone number already exists.');
        }
        throw new Error(error.message);
      }

      setIsCreateModalOpen(false);
      setNewStudent({ fullName: '', phone: '', password: '', stream: 'natural' as 'natural' | 'social', role: 'student' });
      toast.success(`${isSuperAdmin ? 'Teacher' : 'Student'} account created successfully!`);
    } catch (error) {
      console.error('Create error:', error);
      setCreateError(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 pt-14 px-4 pb-4 md:p-8 md:pt-14 overflow-hidden relative">
      <StarField />
      <TopBar />

      <div className="max-w-7xl mx-auto relative z-10 mt-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Teachers Dashboard</h1>
            </div>
            <p className="text-white/50 text-sm">Monitor student progress on 2018 predicted questions</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                {isSuperAdmin ? 'Create Teacher or Student' : 'Create Student'}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/[0.06] backdrop-blur-xl border-white/[0.1] text-white">
              <DialogHeader>
                <DialogTitle className="text-white">{isSuperAdmin ? 'Create Teacher Account' : 'Create Student Account'}</DialogTitle>
                <DialogDescription className="text-white/60">
                  Enter the student's details to create a new account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newStudent.fullName}
                    onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                    placeholder="Enter student's full name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="Enter phone number (e.g., 0912345678)"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    placeholder="Enter password (min 6 characters)"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stream" className="text-white">Stream</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={newStudent.stream === 'natural' ? 'default' : 'outline'}
                      onClick={() => setNewStudent({ ...newStudent, stream: 'natural' })}
                      className={newStudent.stream === 'natural' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'border-white/20 text-white/70 hover:bg-white/10'}
                    >
                      Natural Science
                    </Button>
                    <Button
                      type="button"
                      variant={newStudent.stream === 'social' ? 'default' : 'outline'}
                      onClick={() => setNewStudent({ ...newStudent, stream: 'social' })}
                      className={newStudent.stream === 'social' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'border-white/20 text-white/70 hover:bg-white/10'}
                    >
                      Social Science
                    </Button>
                  </div>
                </div>
                {createError && (
                  <div className="text-red-400 text-sm">{createError}</div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-white/20 text-white/70 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStudent}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  {isCreating ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/[0.04] backdrop-blur-xl border-white/[0.08]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <Users className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{overallStats.totalStudents}</div>
                  <div className="text-xs text-white/50">Total Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.04] backdrop-blur-xl border-white/[0.08]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{overallStats.avgCorrect}</div>
                  <div className="text-xs text-white/50">Avg Correct</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.04] backdrop-blur-xl border-white/[0.08]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{overallStats.avgMissed}</div>
                  <div className="text-xs text-white/50">Avg Missed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.04] backdrop-blur-xl border-white/[0.08]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <BookOpen className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{overallStats.naturalCount}</div>
                  <div className="text-xs text-white/50">Natural</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.04] backdrop-blur-xl border-white/[0.08]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{overallStats.socialCount}</div>
                  <div className="text-xs text-white/50">Social</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/[0.04] backdrop-blur-xl border-white/[0.08] mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStream === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStream('all')}
                  className={filterStream === 'all' ? 'bg-white/20 text-white' : 'border-white/20 text-white/70 hover:bg-white/10'}
                >
                  All Streams
                </Button>
                <Button
                  variant={filterStream === 'natural' ? 'default' : 'outline'}
                  onClick={() => setFilterStream('natural')}
                  className={filterStream === 'natural' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'border-white/20 text-white/70 hover:bg-white/10'}
                >
                  Natural
                </Button>
                <Button
                  variant={filterStream === 'social' ? 'default' : 'outline'}
                  onClick={() => setFilterStream('social')}
                  className={filterStream === 'social' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'border-white/20 text-white/70 hover:bg-white/10'}
                >
                  Social
                </Button>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button
                  variant={filterGrade === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterGrade('all')}
                  className={filterGrade === 'all' ? 'bg-white/20 text-white' : 'border-white/20 text-white/70 hover:bg-white/10'}
                >
                  All Grades
                </Button>
                <Button
                  variant={filterGrade === '9' ? 'default' : 'outline'}
                  onClick={() => setFilterGrade('9')}
                  className={filterGrade === '9' ? 'bg-white/20 text-white' : 'border-white/20 text-white/70 hover:bg-white/10'}
                >
                  Grade 9
                </Button>
                <Button
                  variant={filterGrade === '10' ? 'default' : 'outline'}
                  onClick={() => setFilterGrade('10')}
                  className={filterGrade === '10' ? 'bg-white/20 text-white' : 'border-white/20 text-white/70 hover:bg-white/10'}
                >
                  Grade 10
                </Button>
                <Button
                  variant={filterGrade === '11' ? 'default' : 'outline'}
                  onClick={() => setFilterGrade('11')}
                  className={filterGrade === '11' ? 'bg-white/20 text-white' : 'border-white/20 text-white/70 hover:bg-white/10'}
                >
                  Grade 11
                </Button>
                <Button
                  variant={filterGrade === '12' ? 'default' : 'outline'}
                  onClick={() => setFilterGrade('12')}
                  className={filterGrade === '12' ? 'bg-white/20 text-white' : 'border-white/20 text-white/70 hover:bg-white/10'}
                >
                  Grade 12
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="bg-white/[0.04] backdrop-blur-xl border-white/[0.08] hover:bg-white/[0.08] transition-all cursor-pointer"
              onClick={() => setSelectedStudent(student)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getStreamColor(student.stream)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{student.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStreamBadge(student.stream)}>
                          {student.stream === 'natural' ? 'Natural Science' : 'Social Science'}
                        </Badge>
                        <span className="text-white/50 text-sm">Last activity: {student.lastActivity}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{student.totalCorrect}</div>
                      <div className="text-xs text-white/50">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{student.totalMissed}</div>
                      <div className="text-xs text-white/50">Missed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{getPercentage(student.totalCorrect, student.totalQuestions)}%</div>
                      <div className="text-xs text-white/50">Accuracy</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
            <Card className="bg-white/[0.06] backdrop-blur-xl border-white/[0.1] max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getStreamColor(selectedStudent.stream)} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">{selectedStudent.name}</CardTitle>
                      <CardDescription className="text-white/60">
                        {selectedStudent.stream === 'natural' ? 'Natural Science' : 'Social Science'} Stream
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)} className="text-white/60 hover:text-white">
                    <XCircle className="h-6 w-6" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-3xl font-bold text-emerald-400">{selectedStudent.totalCorrect}</div>
                    <div className="text-sm text-white/50">Total Correct</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="text-3xl font-bold text-red-400">{selectedStudent.totalMissed}</div>
                    <div className="text-sm text-white/50">Total Missed</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-3xl font-bold text-white">{getPercentage(selectedStudent.totalCorrect, selectedStudent.totalQuestions)}%</div>
                    <div className="text-sm text-white/50">Accuracy</div>
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-white mb-4">Subject Performance (2018 Predicted Questions)</h4>
                <div className="space-y-3">
                  {selectedStudent.subjects.map((subject) => (
                    <div key={subject.subject} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-white/60" />
                        <span className="text-white font-medium">{subject.subject}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">{subject.correct}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-400" />
                          <span className="text-red-400 font-semibold">{subject.missed}</span>
                        </div>
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                            <span>{getPercentage(subject.correct, subject.total)}%</span>
                            <span>{subject.total} total</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                              style={{ width: `${getPercentage(subject.correct, subject.total)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachersDashboard;
