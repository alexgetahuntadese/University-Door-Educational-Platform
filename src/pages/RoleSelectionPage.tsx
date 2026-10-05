import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, ArrowRight } from 'lucide-react';
import StarField from '@/components/StarField';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      <StarField />
      
      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to University Door
          </h1>
          <p className="text-white/70 text-lg">
            Choose your role to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Card */}
          <Card
            className="bg-white/[0.06] backdrop-blur-xl border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/login')}
          >
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Student</CardTitle>
              <CardDescription className="text-white/60">
                Access learning materials, quizzes, and track your progress
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg group-hover:shadow-xl transition-all"
                size="lg"
              >
                Enter as Student
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Teacher Card */}
          <Card
            className="bg-white/[0.06] backdrop-blur-xl border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] transition-all duration-300 cursor-pointer group"
            onClick={() => navigate('/login')}
          >
            <CardHeader className="text-center pb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Teacher</CardTitle>
              <CardDescription className="text-white/60">
                Manage students, create accounts, and monitor progress
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <Button
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg group-hover:shadow-xl transition-all"
                size="lg"
              >
                Enter as Teacher
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/50 text-sm">
            Don't have an account? Contact your teacher for credentials.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
