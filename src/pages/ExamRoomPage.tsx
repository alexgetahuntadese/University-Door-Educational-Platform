import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import StarField from "@/components/StarField";

const ExamRoomPage = () => {
  const exams = [
    { title: "Grade 12 EUEE", path: "/grade-12-euee-exam", description: "Practice the national Ethiopian university entrance exam." },
    { title: "Ethiopian Matric", path: "/ethiopian-matric-exam", description: "Prepare for the national matric exam with timed practice." },
    { title: "Predicted Matric", path: "/predicted-matric", description: "Try high-probability predicted questions for the next exam." },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950 text-white relative overflow-hidden">
      <StarField />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-16 pt-24">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Exam Room</h1>
        <p className="mt-2 max-w-2xl text-white/60">
          Timed practice and exam simulation in one place. Choose an exam below to get started.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Link
              key={exam.path}
              to={exam.path}
              className="group rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-lg transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.1]"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold">{exam.title}</h2>
                <ArrowUpRight className="h-4 w-4 text-white/40 transition group-hover:text-white" />
              </div>
              <p className="mt-2 text-sm text-white/60">{exam.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamRoomPage;
