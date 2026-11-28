import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import StarField from '@/components/StarField';
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Copy, Link2, Play, Trophy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getSessionRoomState,
  startSession,
  endSession,
  nextQuestion,
  submitAnswer
} from "@/lib/sessionUtils";
import { getQuestionsForQuiz } from "@/lib/quizUtils";
import LiveQuizSession from "@/components/session/LiveQuizSession";
import SessionLeaderboard from "@/components/session/SessionLeaderboard";
import { useLanguage } from "@/i18n/LanguageContext";

type SessionStatus = 'waiting' | 'in_progress' | 'completed';

interface Session {
  id: string;
  session_code: string;
  host_name: string;
  status: SessionStatus;
  grade: string;
  subject: string;
  chapter_id: string;
  difficulty: string;
  current_question_index: number;
}

interface Participant {
  id: string;
  player_name: string;
  score: number;
  is_host: boolean;
}

interface NormalizedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

const SessionPage = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantId] = useState<string | null>(() => sessionStorage.getItem('participantId'));
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const refreshVersion = useRef(0);
  const isHost = Boolean(participants.some((participant) => participant.id === participantId && participant.is_host));
  const questions = useMemo(() => {
    if (!session) return [];
    return getQuestionsForQuiz(
      Number.parseInt(session.grade, 10),
      session.subject,
      session.chapter_id,
      session.difficulty,
      session.session_code,
    ).slice(0, 10);
  }, [session?.id, session?.grade, session?.subject, session?.chapter_id, session?.difficulty, session?.session_code]);
  const isParticipant = Boolean(participants.some((participant) => participant.id === participantId));

  const refreshData = useCallback(async () => {
    if (!sessionCode) {
      setRoomError("This room link is incomplete.");
      setIsLoadingRoom(false);
      return;
    }

    const requestVersion = ++refreshVersion.current;
    try {
      const { session: currentSession, participants: currentParticipants } = await getSessionRoomState(sessionCode);
      if (requestVersion !== refreshVersion.current) return;
      if (!currentSession) {
        setSession(null);
        setParticipants([]);
        setRoomError("This room could not be found. Ask the host for a new room code.");
        setIsLoadingRoom(false);
        return;
      }

      setSession(currentSession);
      setParticipants(currentParticipants);
      setRoomError(null);
    } catch (error) {
      if (requestVersion === refreshVersion.current) {
        setRoomError(error instanceof Error ? error.message : "Could not connect to this exam room.");
      }
    } finally {
      if (requestVersion === refreshVersion.current) setIsLoadingRoom(false);
    }
  }, [sessionCode]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      await refreshData();
      if (active) timer = setTimeout(poll, 1000);
    };
    void poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [sessionCode, refreshData]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshData();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshData]);

  useEffect(() => {
    setHasAnswered(false);
  }, [session?.current_question_index]);

  const handleStartSession = async () => {
    if (!session || !participantId || isActionPending) return;
    setIsActionPending(true);
    setRoomError(null);
    try {
      await startSession(session.session_code, participantId);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start this exam.";
      setRoomError(message);
      toast({ title: "Could not start exam", description: message, variant: "destructive" });
    } finally {
      setIsActionPending(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!session || !participantId || isActionPending) return;
    setIsActionPending(true);
    setRoomError(null);
    try {
      await nextQuestion(session.session_code, participantId, session.current_question_index);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not advance to the next question.";
      setRoomError(message);
      toast({ title: "Could not advance exam", description: message, variant: "destructive" });
    } finally {
      setIsActionPending(false);
    }
  };

  const handleEndSession = async () => {
    if (!session || !participantId || isActionPending) return;
    setIsActionPending(true);
    setRoomError(null);
    try {
      await endSession(session.session_code, participantId);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not end this exam.";
      setRoomError(message);
      toast({ title: "Could not end exam", description: message, variant: "destructive" });
    } finally {
      setIsActionPending(false);
    }
  };

  const handleAnswerSubmit = async (selectedAnswer: string, isCorrect: boolean) => {
    if (!session || !participantId || hasAnswered) return;
    const currentQuestion = questions[session.current_question_index];
    if (!currentQuestion) return;
    setHasAnswered(true);
    try {
      await submitAnswer(session.session_code, participantId, session.current_question_index, currentQuestion.question, selectedAnswer, isCorrect);
      await refreshData();
    } catch (error) {
      setHasAnswered(false);
      toast({
        title: "Answer not submitted",
        description: error instanceof Error ? error.message : "Check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode || '');
      toast({ title: t('common.codeCopied') });
    } catch {
      toast({ title: "Could not copy room code", description: "Select the code and copy it manually.", variant: "destructive" });
    }
  };

  const copyInviteLink = async () => {
    const inviteUrl = new URL(`/exam-room/join?code=${encodeURIComponent(sessionCode || '')}`, window.location.origin);
    try {
      await navigator.clipboard.writeText(inviteUrl.toString());
      toast({ title: "Invite link copied", description: "Share this link before you start the exam." });
    } catch {
      toast({ title: "Could not copy invite link", description: "Copy the room code and share it with participants.", variant: "destructive" });
    }
  };

  if (!session && isLoadingRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 flex items-center justify-center overflow-hidden relative">
        <StarField starCount={30} shootingCount={2} />
        <div className="text-white text-xl">{t('common.loading')}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 flex items-center justify-center p-4 overflow-hidden relative">
        <StarField starCount={30} shootingCount={2} />
        <Card className="relative z-10 w-full max-w-md border-white/15 bg-white/10 text-center backdrop-blur-md">
          <CardContent className="p-7">
            <h1 className="text-xl font-semibold text-white">Unable to open this room</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{roomError ?? "The room may have ended or the code may be incorrect."}</p>
            <Button onClick={() => navigate("/exam-room/join")} className="mt-6 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
              Try another code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 flex items-center justify-center p-4 overflow-hidden relative">
        <StarField starCount={30} shootingCount={2} />
        <Card className="relative z-10 w-full max-w-md border-white/15 bg-white/10 text-center backdrop-blur-md">
          <CardContent className="p-7">
            <h1 className="text-xl font-semibold text-white">Join this room first</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">Enter your name to join the waiting room and take part in this exam.</p>
            <Button onClick={() => navigate(`/exam-room/join?code=${encodeURIComponent(session.session_code)}`)} className="mt-6 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
              Join exam room
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 p-4 overflow-hidden relative">
        <StarField starCount={30} shootingCount={2} />
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <CardTitle className="text-3xl text-white">{t('results.complete')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionLeaderboard participants={participants} />
              <Button
                onClick={() => navigate('/grades')}
                className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500"
              >
                {t('common.backToHome')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (session.status === 'in_progress' && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 flex items-center justify-center p-4 overflow-hidden relative">
        <StarField starCount={30} shootingCount={2} />
        <Card className="relative z-10 w-full max-w-md border-white/15 bg-white/10 text-center backdrop-blur-md">
          <CardContent className="p-7">
            <h1 className="text-xl font-semibold text-white">Questions unavailable</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">No questions match this room’s grade, subject, and difficulty. The host needs to end this room and create another exam with an available question set.</p>
            {isHost && <Button onClick={handleEndSession} disabled={isActionPending} className="mt-6 w-full bg-green-500 text-white">End exam</Button>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.status === 'in_progress' && questions.length > 0) {
    const currentQuestion = questions[session.current_question_index];
    const isLastQuestion = session.current_question_index >= questions.length - 1;

    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 flex items-center justify-center p-4 overflow-hidden relative">
          <StarField starCount={30} shootingCount={2} />
          <Card className="relative z-10 w-full max-w-md border-white/15 bg-white/10 text-center backdrop-blur-md">
            <CardContent className="p-7">
              <h1 className="text-xl font-semibold text-white">Question unavailable</h1>
              <p className="mt-3 text-sm leading-relaxed text-white/60">The room moved beyond the available questions. Ask the host to end the exam and create a new room.</p>
              {isHost && <Button onClick={handleEndSession} disabled={isActionPending} className="mt-6 w-full bg-green-500 text-white">End exam</Button>}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 p-4 overflow-hidden relative">
        <StarField starCount={30} shootingCount={2} />
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="text-white">
              {t('quiz.question')} {session.current_question_index + 1} / {questions.length}
            </div>
            <div className="text-white flex items-center gap-2">
              <Users className="h-4 w-4" />
              {participants.length} {t('common.players')}
            </div>
          </div>
          {roomError && <p role="status" className="mb-4 rounded-lg border border-amber-300/20 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">Room update issue: {roomError}</p>}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {currentQuestion && (
                <LiveQuizSession
                  key={session.current_question_index}
                  question={currentQuestion}
                  onAnswer={handleAnswerSubmit}
                  hasAnswered={hasAnswered}
                />
              )}

              {isHost && (
                <div className="mt-4 flex gap-2">
                  {!isLastQuestion ? (
                    <Button onClick={handleNextQuestion} disabled={isActionPending} className="flex-1 bg-blue-500 hover:bg-blue-600">
                      {t('session.nextQuestion')}
                    </Button>
                  ) : (
                    <Button onClick={handleEndSession} disabled={isActionPending} className="flex-1 bg-green-500 hover:bg-green-600">
                      {t('session.endQuiz')}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div>
              <SessionLeaderboard participants={participants} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 p-4 overflow-hidden relative">
      <StarField starCount={30} shootingCount={2} />
      <div className="max-w-md mx-auto">
        {roomError && <p role="status" className="mb-4 rounded-lg border border-amber-300/20 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">Room update issue: {roomError}</p>}
        <Button
          variant="ghost"
          onClick={() => navigate("/grades")}
          className="text-white hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.leaveSession')}
        </Button>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-4">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">{t('session.sessionCode')}</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={copyCode}
              aria-label={`Copy room code ${session.session_code}`}
              className="w-full bg-white/20 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-white/30 transition-colors"
            >
              <span className="text-4xl font-mono font-bold text-white tracking-widest">
                {session.session_code}
              </span>
              <Copy className="h-5 w-5 text-white/70" />
            </button>
            <p className="text-center text-white/60 text-sm mt-2">{t('common.clickToCopy')}</p>
            <Button onClick={copyInviteLink} variant="outline" className="mt-4 w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Link2 className="mr-2 h-4 w-4" />
              Copy invite link
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-4">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('common.players')} ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-white/10 rounded-lg p-3"
                >
                  <span className="text-white">{p.player_name}</span>
                  {p.is_host && (
                    <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">{t('common.host')}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-4">
          <CardContent className="pt-4">
            <div className="text-white/80 text-sm space-y-1">
              <p>{t('common.grade')}: {session.grade}</p>
              <p>{t('common.subject')}: {session.subject}</p>
              <p>{t('common.difficulty')}: {session.difficulty}</p>
            </div>
          </CardContent>
        </Card>

        {questions.length === 0 && (
          <p role="alert" className="mb-3 rounded-lg border border-red-300/20 bg-red-950/30 px-3 py-2 text-sm text-red-100">
            No questions are available for this exam setup. Change the grade, subject, or difficulty and create a new room.
          </p>
        )}
        {isHost ? (
          <Button
            onClick={handleStartSession}
            disabled={isActionPending || !isHost || questions.length === 0}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-3"
          >
            <Play className="mr-2 h-5 w-5" />
            {t('session.startQuiz')}
          </Button>
        ) : (
          <div className="text-center text-white/60">
            {t('session.waitingForHost')}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionPage;
