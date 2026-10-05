import { motion, memo } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  DoorOpen,
  GraduationCap,
  LineChart,
  Lock,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EXAM_TOGETHER_URL } from "@/lib/examTogetherUrl";
import { customerContacts } from "@/lib/contactsData";
import StarField from "@/components/StarField";
import { useAuth } from "@/hooks/useAuth";

type MenuDef = {
  title: string;
  route: string;
  description: string;
  icon: LucideIcon;
  external?: true;
  /** Card surface + border */
  surface: string;
  /** Bento cell span on large screens */
  gridClass: string;
  /** Featured styling (purple, no black/slate base) */
  cardVariant?: "predicted";
};

const menuItems: MenuDef[] = [
  {
    title: "Grades",
    route: "/grades",
    description: "Pick your grade and dive into subjects, chapters, and quizzes.",
    icon: GraduationCap,
    gridClass: "lg:col-span-2 min-h-[200px]",
    surface:
      "border-cyan-500/35 bg-gradient-to-br from-cyan-500/20 via-slate-950/80 to-slate-950 hover:border-cyan-400/55 hover:shadow-cyan-500/15",
  },
  {
    title: "Notes",
    route: "/notes",
    description: "Curated notes by subject — read and revise faster.",
    icon: NotebookPen,
    gridClass: "lg:col-span-2 min-h-[200px]",
    surface:
      "border-emerald-500/35 bg-gradient-to-br from-emerald-500/15 via-slate-950/90 to-slate-950 hover:border-emerald-400/50",
  },
  {
    title: "Matric",
    route: "/matric",
    description: "Past papers and exam streams in one place.",
    icon: Trophy,
    gridClass: "lg:col-span-2 min-h-[200px]",
    surface:
      "border-violet-500/35 bg-gradient-to-br from-violet-500/18 via-slate-950/90 to-slate-950 hover:border-violet-400/50",
  },
  {
    title: "Exam Room",
    route: EXAM_TOGETHER_URL,
    description: "Timed practice on our Exam Together companion app.",
    icon: DoorOpen,
    external: true,
    gridClass: "lg:col-span-2 min-h-[200px]",
    surface:
      "border-rose-500/40 bg-gradient-to-br from-rose-500/18 via-slate-950/90 to-slate-950 hover:border-rose-400/55",
  },
  {
    title: "2018 Predicted Matric",
    route: "/predicted-matric",
    description: "High-probability predicted questions for the next matric exam.",
    icon: LineChart,
    gridClass: "lg:col-span-2 min-h-[220px]",
    cardVariant: "predicted",
    surface:
      "border-violet-400/55 bg-gradient-to-br from-fuchsia-600/25 via-violet-900/90 to-indigo-950 hover:border-fuchsia-300/70 hover:from-fuchsia-500/30 hover:via-violet-800/95 hover:shadow-[0_0_40px_-4px_rgba(167,139,250,0.35)]",
  },
  {
    title: "Career",
    route: "/career-simulator",
    description: "Explore paths and choices beyond the classroom.",
    icon: Briefcase,
    gridClass: "lg:col-span-2 min-h-[200px]",
    surface:
      "border-orange-500/35 bg-gradient-to-br from-orange-500/15 via-slate-950/90 to-slate-950 hover:border-orange-400/50",
  },
];

const PAGE_BG = "#10081f"; /* deep violet base — matches predicted tile */

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const Index = () => {
  const { isTeacher, isAdmin } = useAuth();
  const items = isTeacher || isAdmin
    ? [
        ...(isAdmin
          ? [
              {
                title: "Admin",
                route: "/admin",
                description: "Create teachers and student accounts.",
                icon: Users,
                gridClass: "lg:col-span-2 min-h-[200px]",
                surface: "border-red-500/35 bg-gradient-to-br from-red-500/20 via-slate-950/80 to-slate-950 hover:border-red-400/55 hover:shadow-red-500/15",
              },
            ]
          : []),
        ...(isTeacher
          ? [
              {
                title: "Teachers",
                route: "/teachers",
                description: "Manage students and create student accounts.",
                icon: Users,
                gridClass: "lg:col-span-2 min-h-[200px]",
                surface: "border-indigo-500/35 bg-gradient-to-br from-indigo-500/20 via-slate-950/80 to-slate-950 hover:border-indigo-400/55 hover:shadow-indigo-500/15",
              },
            ]
          : []),
        ...menuItems,
      ]
    : menuItems;

  return (
    <div
      className="relative min-h-screen text-white"
      style={{ backgroundColor: PAGE_BG }}
    >
      <StarField />
      {/* Atmosphere */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/80 via-[#10081f] to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(192,132,252,0.22),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(99,102,241,0.18),transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_25%,rgba(217,70,239,0.14),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_50%_at_50%_100%,rgba(251,191,36,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.04)_50%,transparent_65%)]" />
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(167,139,250,0.055)_1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,0.055)_1px,transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 85% 65% at 50% 28%,black,transparent)",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Top chrome */}
        <motion.header
          {...fadeUp}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 z-30 border-b border-violet-400/10 bg-[#10081f]/80 px-4 py-3 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link
              to="/"
              className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10081f]"
            >
              <img src="/logo.svg" alt="" className="h-9 w-9 opacity-95 transition-transform group-hover:scale-105" />
              <span className="text-sm font-semibold tracking-wide text-white/90">
                Simple Road<span className="text-amber-400/80">.</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/contact"
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-amber-400/35 hover:bg-amber-500/10 hover:text-amber-100 sm:px-4 sm:text-sm"
              >
                Contact
              </Link>
              <Link
                to="/login"
                className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-md shadow-amber-900/30 transition-transform hover:scale-[1.02] sm:px-4 sm:text-sm"
              >
                Start
              </Link>
            </nav>
          </div>
        </motion.header>

        <main>
          {/* Hero — editorial split */}
          <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:pb-20 md:pt-14">
            <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-8">
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-7"
              >
                <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/90">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden />
                  Elite education
                </p>
                <h1 className="text-balance font-light leading-[0.95] tracking-tight text-white md:leading-[0.92]">
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">Ethiopian Matric Exam (EUEE)</span>
                  <span className="mt-1 block bg-gradient-to-r from-amber-200 via-amber-400 to-orange-300 bg-clip-text text-5xl font-semibold text-transparent sm:text-6xl md:text-7xl lg:text-8xl">
                    Preparation Platform for Grade 9–12 Students in Ethiopia
                  </span>
                </h1>
                <p className="mt-8 max-w-xl text-pretty text-base leading-relaxed text-white/55 md:text-lg">
                  SuccessDoor is an Ethiopian matric exam preparation platform designed to help Grade 9–12 students prepare for the Ethiopian University Entrance Exam (EUEE). It provides past papers, quizzes, notes, and practice tests to improve exam performance.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-xl transition-transform hover:scale-[1.02] hover:bg-amber-50"
                  >
                    Get Started
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link
                    to="/matric"
                    className="text-sm font-medium text-amber-200/90 underline decoration-amber-500/40 underline-offset-4 transition-colors hover:text-amber-100"
                  >
                    Go to Matric exams
                  </Link>
                </div>

                {/* Role Selection Cards */}
                <div className="mt-12 grid md:grid-cols-2 gap-6">
                  <Link
                    to="/login"
                    className="group relative overflow-hidden rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-cyan-500/20 via-slate-950/80 to-slate-950 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/55 hover:shadow-cyan-500/15"
                  >
                    <div className="pointer-events-none absolute -right-6 top-0 h-32 w-32 rounded-full blur-2xl bg-cyan-500/30 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex h-full flex-col">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-950/80 text-cyan-100 shadow-inner">
                        <GraduationCap className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="mt-4">
                        <h3 className="text-xl font-semibold text-white">Student</h3>
                        <p className="mt-2 text-sm text-white/50">
                          Access learning materials, quizzes, and track your progress
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-cyan-300/70">
                        <span className="text-sm font-medium">Enter as Student</span>
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/login"
                    className="group relative overflow-hidden rounded-2xl border border-violet-500/35 bg-gradient-to-br from-violet-500/20 via-slate-950/80 to-slate-950 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/55 hover:shadow-violet-500/15"
                  >
                    <div className="pointer-events-none absolute -right-6 top-0 h-32 w-32 rounded-full blur-2xl bg-violet-500/30 transition-opacity group-hover:opacity-100" />
                    <div className="relative flex h-full flex-col">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-950/80 text-violet-100 shadow-inner">
                        <Users className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="mt-4">
                        <h3 className="text-xl font-semibold text-white">Teacher</h3>
                        <p className="mt-2 text-sm text-white/50">
                          Manage students, create accounts, and monitor progress
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-violet-300/70">
                        <span className="text-sm font-medium">Enter as Teacher</span>
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                {...fadeUp}
                transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative lg:col-span-5"
              >
                <div className="relative overflow-hidden rounded-3xl border border-violet-400/15 bg-gradient-to-br from-violet-950/50 via-white/[0.06] to-indigo-950/60 p-6 shadow-2xl shadow-violet-950/50 ring-1 ring-violet-400/10 backdrop-blur-md md:p-8">
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
                  <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />
                  <div className="relative flex flex-col items-center text-center">
                    <img src="/logo.svg" alt="Simple Road logo" className="mb-6 h-24 w-24 opacity-95 md:h-28 md:w-28" />
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">Since 2026</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">
                      One journey: learn, practise, sit exams, plan what comes next.
                    </p>
                    <div className="mt-8 grid w-full grid-cols-3 gap-3 border-t border-white/10 pt-6 text-center">
                      <div>
                        <p className="text-2xl font-semibold text-amber-200 md:text-3xl">9–12</p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/40">Grades</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-amber-200 md:text-3xl">2</p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/40">Streams</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-amber-200 md:text-3xl">∞</p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/40">Practice</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Bento navigation */}
          <section className="border-t border-violet-500/15 bg-violet-950/25 px-4 py-16 md:py-20" aria-labelledby="nav-heading">
            <div className="mx-auto max-w-6xl">
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.45 }}
                className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
              >
                <div>
                  <h2 id="nav-heading" className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                    Choose your path
                  </h2>
                  <p className="mt-2 max-w-lg text-sm text-white/45 md:text-base">
                    Tiles open the matching area of the app. Exam Room opens our companion site in this tab.
                  </p>
                </div>
                <div className="hidden items-center gap-2 text-xs text-white/35 md:flex">
                  <BookOpen className="h-4 w-4 text-amber-400/60" aria-hidden />
                  <span>All resources · one platform</span>
                </div>
              </motion.div>

              <div className="grid auto-rows-min grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
                {items.map((item, index) => {
                  const Icon = item.icon;
                  const isPredicted = item.cardVariant === "predicted";
                  const inner = (
                    <div
                      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 md:rounded-3xl md:p-6 ${
                        isPredicted
                          ? "shadow-lg shadow-violet-950/60 ring-2 ring-violet-400/35 hover:shadow-xl hover:shadow-violet-600/30"
                          : "shadow-lg shadow-black/30 hover:shadow-xl"
                      } ${item.surface}`}
                    >
                      {isPredicted && (
                        <span className="relative z-10 mb-2 inline-flex self-start rounded-full border border-violet-300/40 bg-violet-950/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-fuchsia-200">
                          Featured
                        </span>
                      )}
                      <div
                        className={`pointer-events-none absolute -right-6 top-0 h-32 w-32 rounded-full blur-2xl transition-opacity group-hover:opacity-100 ${
                          isPredicted ? "bg-fuchsia-500/30 opacity-80" : "bg-white/5"
                        }`}
                      />
                      <div className="relative mb-auto flex items-start justify-between gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-inner ${
                            isPredicted
                              ? "border-violet-300/30 bg-violet-950/80 text-violet-100"
                              : "border-white/10 bg-black/30 text-amber-200/90"
                          }`}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-white/30" aria-hidden />
                          <ArrowUpRight
                            className={`h-5 w-5 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                              isPredicted
                                ? "text-violet-300/50 group-hover:text-fuchsia-200"
                                : "text-white/20 group-hover:text-amber-300/90"
                            }`}
                            aria-hidden
                          />
                        </div>
                      </div>
                      <div className="relative mt-5">
                        <h3
                          className={`text-lg font-semibold leading-snug tracking-tight md:text-xl ${
                            isPredicted ? "text-violet-50" : "text-white"
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p
                          className={`mt-2 text-sm leading-relaxed ${
                            isPredicted ? "text-violet-200/75" : "text-white/50"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );

                  const focusRing = isPredicted
                    ? "focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10081f]"
                    : "focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10081f]";

                  return (
                    <motion.div
                      key={item.title}
                      {...fadeUp}
                      transition={{ duration: 0.4, delay: 0.04 * index }}
                      className={item.gridClass}
                    >
                      {item.external ? (
                        <a href={item.route} className={`block h-full min-h-0 outline-none ${focusRing}`}>
                          {inner}
                        </a>
                      ) : (
                        <Link to={item.route} className={`block h-full min-h-0 outline-none ${focusRing}`}>
                          {inner}
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Contact ribbon */}
          <section
            className="border-t border-violet-400/20 bg-gradient-to-r from-amber-500/[0.07] via-violet-950/50 to-fuchsia-950/30 px-4 py-14 md:py-16"
            aria-labelledby="contact-heading"
          >
            <div className="mx-auto max-w-6xl">
              <h2 id="contact-heading" className="sr-only">
                Contact us
              </h2>
              <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200/70">Reach the team</p>
                  <p className="mt-1 text-2xl font-semibold text-white md:text-3xl">We are here to help</p>
                </div>
                <Link
                  to="/contact"
                  className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-semibold text-amber-200 underline decoration-amber-500/40 underline-offset-4 hover:text-white md:mt-0"
                >
                  Full contact page
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {customerContacts.map((c, i) => (
                  <motion.li
                    key={c.name}
                    {...fadeUp}
                    transition={{ duration: 0.35, delay: 0.05 * i }}
                    className="rounded-2xl border border-violet-400/15 bg-indigo-950/40 p-4 backdrop-blur-sm md:p-5"
                  >
                    <p className="font-semibold text-white">{c.name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.phoneNumbers.map((p) => (
                        <a
                          key={p}
                          href={`tel:${p}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 font-mono text-sm text-amber-50 transition-colors hover:border-amber-400/40 hover:bg-amber-500/15"
                        >
                          <Phone className="h-3.5 w-3.5 text-amber-400/80" aria-hidden />
                          {p}
                        </a>
                      ))}
                    </div>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-8 flex flex-wrap items-center gap-2 text-sm text-white/45">
                <Mail className="h-4 w-4 shrink-0 text-amber-400/70" aria-hidden />
                <a
                  href="mailto:alexgetahuntadese@gmail.com"
                  className="font-medium text-amber-100/90 underline decoration-amber-500/30 underline-offset-2 hover:text-white"
                >
                  alexgetahuntadese@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-violet-500/10 px-4 py-10">
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="max-w-xl text-sm leading-relaxed text-white/55">
                  Created by <span className="font-semibold text-amber-200/90">Milkesa Comm.</span>{" "}
                  <span className="font-semibold text-amber-200/90">
                    Getahun Tadese in Eastern Ethiopia and Addis Ababa
                  </span>
                  .
                </p>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/35">
                  <MapPin className="h-3.5 w-3.5 text-amber-500/50" aria-hidden />
                  © 2026 Simple Road. All rights reserved.
                </p>
              </div>
              <img src="/logo.svg" alt="" className="h-12 w-12 opacity-80 md:h-14 md:w-14" aria-hidden />
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default memo(Index);
