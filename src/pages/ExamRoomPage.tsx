import { useEffect } from "react";
import { EXAM_TOGETHER_URL } from "@/lib/examTogetherUrl";

/** Legacy `/exam-room` path: send users to Exam Together on Vercel */
const ExamRoomPage = () => {
  useEffect(() => {
    window.location.replace(EXAM_TOGETHER_URL);
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white/70 text-sm">
      Redirecting to Exam Together…
    </div>
  );
};

export default ExamRoomPage;
