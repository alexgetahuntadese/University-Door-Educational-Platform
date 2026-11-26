import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList, DoorOpen, Plus, Users, Wifi } from "lucide-react";
import StarField from "@/components/StarField";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/usePageTitle";
import { isCloudflareRoomsConfigured } from "@/lib/sessionUtils";

const ExamRoomPage = () => {
  const navigate = useNavigate();
  usePageTitle("Virtual Exam Room");

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 pb-12 pt-16 text-white md:px-6">
      <StarField starCount={35} shootingCount={2} />
      <TopBar />

      <main className="relative z-10 mx-auto max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 text-white/65 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Home
        </Button>

        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-100 shadow-lg shadow-violet-950/40">
            <Users className="h-8 w-8" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200/70">Study together</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Virtual Exam Room</h1>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            Host a live quiz for your class or join an exam with a room code. Answer together and follow the leaderboard in real time.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
          <Card className="group border-violet-300/15 bg-gradient-to-br from-violet-500/[0.12] to-indigo-500/[0.05] transition hover:border-violet-300/35 hover:bg-violet-500/[0.16]">
            <CardContent className="flex h-full flex-col p-6 md:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/15 text-violet-100"><Plus className="h-6 w-6" /></div>
              <h2 className="mt-5 text-xl font-semibold">Create a room</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">Choose a grade, subject, and difficulty. We’ll give you a code to share with everyone taking the quiz.</p>
              <Button onClick={() => navigate("/exam-room/create")} className="mt-6 h-11 bg-violet-500 text-white hover:bg-violet-400">
                <ClipboardList className="mr-2 h-4 w-4" /> Set up an exam
              </Button>
            </CardContent>
          </Card>

          <Card className="group border-emerald-300/15 bg-gradient-to-br from-emerald-500/[0.10] to-teal-500/[0.04] transition hover:border-emerald-300/35 hover:bg-emerald-500/[0.14]">
            <CardContent className="flex h-full flex-col p-6 md:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-100"><DoorOpen className="h-6 w-6" /></div>
              <h2 className="mt-5 text-xl font-semibold">Join a room</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">Enter the six-character code from your teacher or host, add your name, and join the waiting room.</p>
              <Button onClick={() => navigate("/exam-room/join")} className="mt-6 h-11 bg-emerald-500 text-white hover:bg-emerald-400">
                <DoorOpen className="mr-2 h-4 w-4" /> Enter room code
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-7 flex max-w-3xl items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/50">
          <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-violet-200/70" />
          <p>
            {isCloudflareRoomsConfigured
              ? "Room codes connect participants to the same live quiz. The host controls when the exam starts and advances to each question."
              : "Shared exam rooms are not configured in this environment. Rooms created here are only available in this browser."}
          </p>
        </div>
      </main>
    </div>
  );
};

export default ExamRoomPage;
