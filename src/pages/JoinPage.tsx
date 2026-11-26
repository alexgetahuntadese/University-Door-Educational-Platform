import { useState, type FormEvent } from "react";
import StarField from '@/components/StarField';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, LogIn } from "lucide-react";
import { joinSession } from "@/lib/sessionUtils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import TopBar from "@/components/TopBar";
import { usePageTitle } from "@/hooks/usePageTitle";

const JoinPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [sessionCode, setSessionCode] = useState(() =>
    (searchParams.get("code") ?? "").trim().toUpperCase().slice(0, 6),
  );
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  usePageTitle("Join an Exam Room");

  const handleJoinSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = sessionCode.trim().toUpperCase();
    const normalizedName = playerName.trim();

    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(normalizedCode)) {
      setJoinError("Enter the six-character room code exactly as shown. Codes do not use I, O, 0, or 1.");
      return;
    }
    if (!normalizedName) {
      setJoinError(t('join.fillBoth'));
      return;
    }

    setJoinError(null);
    setIsJoining(true);
    try {
      const { session, participant } = await joinSession(
        normalizedCode,
        normalizedName
      );
      
      sessionStorage.setItem('participantId', participant.id);
      sessionStorage.setItem('isHost', 'false');
      
      navigate(`/session/${session.session_code}`);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : t('join.errorJoining');
      setJoinError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">{t('join.joinQuiz')}</CardTitle>
            <CardDescription className="text-blue-100">
              {t('join.enterCode')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinSession} className="space-y-4">
            <div>
              <label className="text-sm text-white/80 mb-2 block">{t('join.sessionCode')}</label>
              <Input
                placeholder={t('join.enterCodePlaceholder')}
                value={sessionCode}
                onChange={(e) => {
                  setSessionCode(e.target.value.replace(/\s/g, "").toUpperCase().slice(0, 6));
                  setJoinError(null);
                }}
                maxLength={6}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-label={t('join.sessionCode')}
                aria-invalid={Boolean(joinError)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <div>
              <label className="text-sm text-white/80 mb-2 block">{t('host.yourName')}</label>
              <Input
                placeholder={t('host.enterName')}
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setJoinError(null);
                }}
                maxLength={40}
                autoComplete="nickname"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {joinError && (
              <p role="alert" aria-live="polite" className="rounded-lg border border-red-300/25 bg-red-950/40 px-3 py-2 text-sm text-red-100">
                {joinError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isJoining || sessionCode.length !== 6 || !playerName.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-3"
            >
              {isJoining ? t('join.joining') : t('join.joinSession')}
            </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinPage;
