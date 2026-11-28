import { getQuestionsForQuiz } from "@/lib/quizUtils";

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
const cloudflareRoomsUrl = import.meta.env.VITE_CLOUDFLARE_ROOMS_URL?.trim().replace(/\/$/, "");

export const isCloudflareRoomsConfigured = Boolean(cloudflareRoomsUrl);

export const generateSessionCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
};

const getLocalSessions = (): Session[] => JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]");
const saveLocalSessions = (sessions: Session[]) => localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
const getLocalParticipants = (): Participant[] => JSON.parse(localStorage.getItem(PARTICIPANTS_KEY) ?? "[]");
const saveLocalParticipants = (participants: Participant[]) => localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
const getLocalAnswers = (): SessionAnswer[] => JSON.parse(localStorage.getItem(ANSWERS_KEY) ?? "[]");
const saveLocalAnswers = (answers: SessionAnswer[]) => localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));

const roomRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  if (!cloudflareRoomsUrl) throw new Error("Cloudflare exam rooms are not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  let response: Response;
  try {
    response = await fetch(`${cloudflareRoomsUrl}/api/rooms${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    if (controller.signal.aborted) throw new Error("The room service took too long to respond. Check your connection and try again.");
    throw new Error("Could not reach the live exam room. Check your connection and try again.");
  } finally {
    clearTimeout(timeout);
  }
  const result = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    const error = new Error(result.error ?? "Could not connect to the exam room.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return result as T;
};

export const createSession = async (
  hostName: string,
  grade: string,
  subject: string,
  chapterId: string,
  difficulty: string,
) => {
  if (isCloudflareRoomsConfigured) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const sessionCode = generateSessionCode();
      const answerKeys = getQuestionsForQuiz(Number(grade), subject, chapterId, difficulty, sessionCode)
        .slice(0, 10)
        .map(({ question, correctAnswer }) => ({ question, correctAnswer }));
      if (answerKeys.length === 0) throw new Error("No questions are available for this exam setup.");

      try {
        return await roomRequest<{ session: Session; participant: Participant }>("", {
          method: "POST",
          body: JSON.stringify({ hostName, grade, subject, chapterId, difficulty, sessionCode, answerKeys }),
        });
      } catch (error) {
        if ((error as Error & { status?: number }).status !== 409) throw error;
      }
    }
    throw new Error("Could not reserve a room code. Please try again.");
  }

  const sessionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const session: Session = {
    id: sessionId,
    session_code: generateSessionCode(),
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
    id: crypto.randomUUID(), session_id: sessionId, player_name: hostName,
    score: 0, is_host: true, joined_at: createdAt,
  };
  saveLocalSessions([...getLocalSessions(), session]);
  saveLocalParticipants([...getLocalParticipants(), participant]);
  return { session, participant };
};

export const joinSession = async (sessionCode: string, playerName: string) => {
  const normalizedCode = sessionCode.trim().toUpperCase();
  if (isCloudflareRoomsConfigured) {
    return roomRequest<{ session: Session; participant: Participant }>(`/${normalizedCode}/join`, {
      method: "POST", body: JSON.stringify({ playerName }),
    });
  }

  const session = getLocalSessions().find(
    (item) => item.session_code === normalizedCode && item.status === "waiting",
  ) ?? null;
  if (!session) throw new Error("This room is not available on this device. Refresh the app, then ask the host to create and share a new exam room.");
  const participant: Participant = {
    id: crypto.randomUUID(), session_id: session.id, player_name: playerName.trim(),
    score: 0, is_host: false, joined_at: new Date().toISOString(),
  };
  saveLocalParticipants([...getLocalParticipants(), participant]);
  return { session, participant };
};

export const getSession = async (sessionCode: string): Promise<Session | null> => {
  if (isCloudflareRoomsConfigured) {
    const result = await roomRequest<{ session: Session | null }>(`/${sessionCode.trim().toUpperCase()}`);
    return result.session;
  }
  return getLocalSessions().find((item) => item.session_code === sessionCode.toUpperCase()) ?? null;
};

export const getSessionParticipants = async (sessionCode: string): Promise<Participant[]> => {
  if (isCloudflareRoomsConfigured) {
    const result = await roomRequest<{ participants: Participant[] }>(`/${sessionCode.trim().toUpperCase()}`);
    return result.participants;
  }
  const session = getLocalSessions().find((item) => item.session_code === sessionCode.toUpperCase());
  return getLocalParticipants().filter((participant) => participant.session_id === session?.id).sort((a, b) => b.score - a.score);
};

export const getSessionRoomState = async (sessionCode: string): Promise<{ session: Session | null; participants: Participant[] }> => {
  if (isCloudflareRoomsConfigured) {
    return roomRequest<{ session: Session | null; participants: Participant[] }>(`/${sessionCode.trim().toUpperCase()}`);
  }

  const session = getLocalSessions().find((item) => item.session_code === sessionCode.toUpperCase()) ?? null;
  const participants = session
    ? getLocalParticipants().filter((participant) => participant.session_id === session.id).sort((a, b) => b.score - a.score)
    : [];
  return { session, participants };
};

const updateSession = async (sessionCode: string, action: string, participantId: string, payload: object = {}) => {
  await roomRequest(`/${sessionCode.toUpperCase()}/${action}`, {
    method: "POST", body: JSON.stringify({ participantId, ...payload }),
  });
};

export const startSession = async (sessionCode: string, participantId: string) => {
  if (isCloudflareRoomsConfigured) return updateSession(sessionCode, "start", participantId);
  const sessions = getLocalSessions();
  const session = sessions.find((item) => item.session_code === sessionCode.toUpperCase());
  if (session) { session.status = "in_progress"; session.current_question_index = 0; saveLocalSessions(sessions); }
};

export const nextQuestion = async (sessionCode: string, participantId: string, currentIndex: number) => {
  if (isCloudflareRoomsConfigured) return updateSession(sessionCode, "next", participantId, { currentIndex });
  const sessions = getLocalSessions();
  const session = sessions.find((item) => item.session_code === sessionCode.toUpperCase());
  if (session) { session.current_question_index = currentIndex + 1; saveLocalSessions(sessions); }
};

export const endSession = async (sessionCode: string, participantId: string) => {
  if (isCloudflareRoomsConfigured) return updateSession(sessionCode, "end", participantId);
  const sessions = getLocalSessions();
  const session = sessions.find((item) => item.session_code === sessionCode.toUpperCase());
  if (session) { session.status = "completed"; saveLocalSessions(sessions); }
};

export const submitAnswer = async (
  sessionCode: string,
  participantId: string,
  questionIndex: number,
  questionText: string,
  selectedAnswer: string,
  isCorrect: boolean,
) => {
  if (isCloudflareRoomsConfigured) {
    return roomRequest(`/${sessionCode.toUpperCase()}/answers`, {
      method: "POST", body: JSON.stringify({ participantId, questionIndex, questionText, selectedAnswer }),
    });
  }

  const session = getLocalSessions().find((item) => item.session_code === sessionCode.toUpperCase());
  if (!session) return;
  const answers = getLocalAnswers();
  if (answers.some((answer) => answer.participant_id === participantId && answer.question_index === questionIndex)) return;
  answers.push({
    id: crypto.randomUUID(), session_id: session.id, participant_id: participantId,
    question_index: questionIndex, selected_answer: selectedAnswer, is_correct: isCorrect,
    answered_at: new Date().toISOString(),
  });
  saveLocalAnswers(answers);
  if (isCorrect) {
    const participants = getLocalParticipants();
    const participant = participants.find((item) => item.id === participantId);
    if (participant) { participant.score += 10; saveLocalParticipants(participants); }
  }
};
