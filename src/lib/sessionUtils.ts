import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabaseConfig";

export type SessionStatus = "waiting" | "in_progress" | "completed";

export interface Session {
  id: string;
  session_code: string;
  host_name: string;
  status: SessionStatus;
  grade: string;
  subject: string;
  chapter_id: string;
  difficulty: string;
  current_question_index: number;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  player_name: string;
  score: number;
  is_host: boolean;
  joined_at: string;
}

interface SessionAnswer {
  id: string;
  session_id: string;
  participant_id: string;
  question_index: number;
  selected_answer: string;
  is_correct: boolean;
  answered_at: string;
}

const SESSIONS_KEY = "quiz_sessions";
const PARTICIPANTS_KEY = "session_participants";
const ANSWERS_KEY = "session_answers";

// These tables are added by supabase/migrations/20261126000000_virtual_exam_rooms.sql.
const roomDb = supabase as unknown as SupabaseClient<any>;

export const generateSessionCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getLocalSessions = (): Session[] => JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]");
const saveLocalSessions = (sessions: Session[]) => localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
const getLocalParticipants = (): Participant[] => JSON.parse(localStorage.getItem(PARTICIPANTS_KEY) ?? "[]");
const saveLocalParticipants = (participants: Participant[]) => localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
const getLocalAnswers = (): SessionAnswer[] => JSON.parse(localStorage.getItem(ANSWERS_KEY) ?? "[]");
const saveLocalAnswers = (answers: SessionAnswer[]) => localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export const createSession = async (
  hostName: string,
  grade: string,
  subject: string,
  chapterId: string,
  difficulty: string,
) => {
  const sessionCode = generateSessionCode();
  const sessionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const session: Session = {
    id: sessionId,
    session_code: sessionCode,
    host_name: hostName,
    status: "waiting",
    grade,
    subject,
    chapter_id: chapterId,
    difficulty,
    current_question_index: 0,
    created_at: createdAt,
  };
  const participant: Participant = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    player_name: hostName,
    score: 0,
    is_host: true,
    joined_at: createdAt,
  };

  if (isSupabaseConfigured) {
    const { error: sessionError } = await roomDb.from("quiz_sessions").insert(session);
    throwIfError(sessionError);
    const { error: participantError } = await roomDb.from("session_participants").insert(participant);
    if (participantError) {
      await roomDb.from("quiz_sessions").delete().eq("id", sessionId);
      throwIfError(participantError);
    }
  } else {
    saveLocalSessions([...getLocalSessions(), session]);
    saveLocalParticipants([...getLocalParticipants(), participant]);
  }

  return { session, participant };
};

export const joinSession = async (sessionCode: string, playerName: string) => {
  const normalizedCode = sessionCode.trim().toUpperCase();
  let session: Session | null = null;

  if (isSupabaseConfigured) {
    const { data, error } = await roomDb
      .from("quiz_sessions")
      .select("*")
      .eq("session_code", normalizedCode)
      .eq("status", "waiting")
      .maybeSingle();
    throwIfError(error);
    session = data as Session | null;
  } else {
    session = getLocalSessions().find(
      (item) => item.session_code === normalizedCode && item.status === "waiting",
    ) ?? null;
  }

  if (!session) throw new Error("Room not found. Check the code and make sure the host has not started the exam.");

  const participant: Participant = {
    id: crypto.randomUUID(),
    session_id: session.id,
    player_name: playerName.trim(),
    score: 0,
    is_host: false,
    joined_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { error } = await roomDb.from("session_participants").insert(participant);
    throwIfError(error);
  } else {
    saveLocalParticipants([...getLocalParticipants(), participant]);
  }

  return { session, participant };
};

export const getSession = async (sessionCode: string): Promise<Session | null> => {
  if (isSupabaseConfigured) {
    const { data, error } = await roomDb
      .from("quiz_sessions")
      .select("*")
      .eq("session_code", sessionCode.trim().toUpperCase())
      .maybeSingle();
    throwIfError(error);
    return data as Session | null;
  }

  return getLocalSessions().find((item) => item.session_code === sessionCode.toUpperCase()) ?? null;
};

export const getSessionParticipants = async (sessionId: string): Promise<Participant[]> => {
  if (isSupabaseConfigured) {
    const { data, error } = await roomDb
      .from("session_participants")
      .select("*")
      .eq("session_id", sessionId)
      .order("score", { ascending: false });
    throwIfError(error);
    return (data ?? []) as Participant[];
  }

  return getLocalParticipants()
    .filter((participant) => participant.session_id === sessionId)
    .sort((a, b) => b.score - a.score);
};

export const startSession = async (sessionId: string) => {
  if (isSupabaseConfigured) {
    const { error } = await roomDb.from("quiz_sessions").update({ status: "in_progress", current_question_index: 0 }).eq("id", sessionId);
    throwIfError(error);
    return;
  }

  const sessions = getLocalSessions();
  const session = sessions.find((item) => item.id === sessionId);
  if (session) {
    session.status = "in_progress";
    session.current_question_index = 0;
    saveLocalSessions(sessions);
  }
};

export const nextQuestion = async (sessionId: string, currentIndex: number) => {
  if (isSupabaseConfigured) {
    const { error } = await roomDb.from("quiz_sessions").update({ current_question_index: currentIndex + 1 }).eq("id", sessionId);
    throwIfError(error);
    return;
  }

  const sessions = getLocalSessions();
  const session = sessions.find((item) => item.id === sessionId);
  if (session) {
    session.current_question_index = currentIndex + 1;
    saveLocalSessions(sessions);
  }
};

export const endSession = async (sessionId: string) => {
  if (isSupabaseConfigured) {
    const { error } = await roomDb.from("quiz_sessions").update({ status: "completed" }).eq("id", sessionId);
    throwIfError(error);
    return;
  }

  const sessions = getLocalSessions();
  const session = sessions.find((item) => item.id === sessionId);
  if (session) {
    session.status = "completed";
    saveLocalSessions(sessions);
  }
};

export const submitAnswer = async (
  sessionId: string,
  participantId: string,
  questionIndex: number,
  selectedAnswer: string,
  isCorrect: boolean,
) => {
  if (isSupabaseConfigured) {
    const { data: existingAnswer, error: lookupError } = await roomDb
      .from("session_answers")
      .select("id")
      .eq("participant_id", participantId)
      .eq("question_index", questionIndex)
      .maybeSingle();
    throwIfError(lookupError);
    if (existingAnswer) return;

    const { error: answerError } = await roomDb.from("session_answers").insert({
      id: crypto.randomUUID(),
      session_id: sessionId,
      participant_id: participantId,
      question_index: questionIndex,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    });
    throwIfError(answerError);

    if (isCorrect) {
      const { data: participant, error: participantLookupError } = await roomDb
        .from("session_participants")
        .select("score")
        .eq("id", participantId)
        .single();
      throwIfError(participantLookupError);
      const { error: scoreError } = await roomDb
        .from("session_participants")
        .update({ score: (participant?.score ?? 0) + 10 })
        .eq("id", participantId);
      throwIfError(scoreError);
    }
    return;
  }

  const answers = getLocalAnswers();
  if (answers.some((answer) => answer.participant_id === participantId && answer.question_index === questionIndex)) return;

  answers.push({
    id: crypto.randomUUID(),
    session_id: sessionId,
    participant_id: participantId,
    question_index: questionIndex,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
    answered_at: new Date().toISOString(),
  });
  saveLocalAnswers(answers);

  if (isCorrect) {
    const participants = getLocalParticipants();
    const participant = participants.find((item) => item.id === participantId);
    if (participant) {
      participant.score += 10;
      saveLocalParticipants(participants);
    }
  }
};
