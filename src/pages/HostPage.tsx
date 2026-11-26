import { useMemo, useState, type FormEvent } from "react";
import StarField from '@/components/StarField';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users } from "lucide-react";
import { createSession } from "@/lib/sessionUtils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { getAvailableQuizSubjects, getQuestionsForQuiz } from "@/lib/quizUtils";
import TopBar from "@/components/TopBar";
import { usePageTitle } from "@/hooks/usePageTitle";

const HostPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [hostName, setHostName] = useState("");
  const [grade, setGrade] = useState("12");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [isCreating, setIsCreating] = useState(false);

  const grades = ["10", "11", "12"];
  const subjects = useMemo(() => getAvailableQuizSubjects(Number(grade)), [grade]);
  const difficulties = ["all", "easy", "medium", "hard"];
  const questionCount = useMemo(
    () => getQuestionsForQuiz(Number(grade), subject, "all", difficulty).length,
    [grade, subject, difficulty],
  );

  usePageTitle("Create an Exam Room");

  const handleGradeChange = (value: string) => {
    setGrade(value);
    setSubject("");
  };

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hostName.trim() || !grade || !subject || questionCount === 0) {
      toast({
        title: t('host.missingFields'),
        description: t('host.fillRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { session, participant } = await createSession(
        hostName.trim(),
        grade,
        subject,
        "all",
        difficulty
      );
      
      sessionStorage.setItem('participantId', participant.id);
      sessionStorage.setItem('isHost', 'true');
      
      navigate(`/session/${session.session_code}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : t('host.errorCreating'),
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 p-4 pt-16 overflow-hidden relative">
      <StarField starCount={30} shootingCount={2} />
      <TopBar />
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/exam-room")}
          className="text-white hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">{t('host.hostQuiz')}</CardTitle>
            <CardDescription className="text-blue-100">
              {t('host.hostDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="text-sm text-white/80 mb-2 block">{t('host.yourName')}</label>
              <Input
                placeholder={t('host.enterName')}
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                maxLength={40}
                autoComplete="nickname"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <label className="text-sm text-white/80 mb-2 block">{t('common.grade')}</label>
              <Select value={grade} onValueChange={handleGradeChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t('host.selectGrade')} />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g} value={g}>{t('common.grade')} {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-white/80 mb-2 block">{t('common.subject')}</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t('host.selectSubject')} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-white/80 mb-2 block">{t('common.difficulty')}</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t('host.selectDifficulty')} />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((d) => (
                    <SelectItem key={d} value={d}>{d === "all" ? "Any difficulty" : d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-white/55">
              {subject ? `${questionCount} questions available` : "Choose a subject to see available questions."}
            </p>

            <Button
              type="submit"
              disabled={isCreating || !hostName.trim() || !subject || questionCount === 0}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
            >
              {isCreating ? t('host.creating') : t('host.createSession')}
            </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostPage;
