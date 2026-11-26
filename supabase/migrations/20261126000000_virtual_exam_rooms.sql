-- Shared live quiz rooms. The room code is the public invitation; no account is
-- required to participate. These records contain only names and quiz scores.
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE CHECK (session_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter_id TEXT NOT NULL DEFAULT 'all',
  difficulty TEXT NOT NULL DEFAULT 'all',
  current_question_index INTEGER NOT NULL DEFAULT 0 CHECK (current_question_index >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session_participants (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session_answers (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.session_participants(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL CHECK (question_index >= 0),
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_code_status
  ON public.quiz_sessions(session_code, status);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_score
  ON public.session_participants(session_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_session_answers_participant_question
  ON public.session_answers(participant_id, question_index);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Public can read quiz sessions"
  ON public.quiz_sessions FOR SELECT TO anon, authenticated USING (TRUE);
DROP POLICY IF EXISTS "Public can create quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Public can create quiz sessions"
  ON public.quiz_sessions FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Public can update quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Public can update quiz sessions"
  ON public.quiz_sessions FOR UPDATE TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Public can delete quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Public can delete quiz sessions"
  ON public.quiz_sessions FOR DELETE TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "Public can read session participants" ON public.session_participants;
CREATE POLICY "Public can read session participants"
  ON public.session_participants FOR SELECT TO anon, authenticated USING (TRUE);
DROP POLICY IF EXISTS "Public can create session participants" ON public.session_participants;
CREATE POLICY "Public can create session participants"
  ON public.session_participants FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Public can update session participants" ON public.session_participants;
CREATE POLICY "Public can update session participants"
  ON public.session_participants FOR UPDATE TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public can read session answers" ON public.session_answers;
CREATE POLICY "Public can read session answers"
  ON public.session_answers FOR SELECT TO anon, authenticated USING (TRUE);
DROP POLICY IF EXISTS "Public can submit session answers" ON public.session_answers;
CREATE POLICY "Public can submit session answers"
  ON public.session_answers FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
