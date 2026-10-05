
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";
import { NotificationPermissionRequest } from "@/components/NotificationPermissionRequest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/i18n/LanguageContext";
import AuthProvider from "@/contexts/AuthContext";
import RequireAuth from "@/components/auth/RequireAuth";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load components for code splitting
const Index = lazy(() => import("./pages/Index"));
const GradeSelection = lazy(() => import("./pages/GradeSelection"));
const GradesPage = lazy(() => import("./pages/GradesPage"));
const SubjectsPage = lazy(() => import("./pages/SubjectsPage"));
const ChaptersPage = lazy(() => import("./pages/ChaptersPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const CareerSimulatorPage = lazy(() => import("./pages/CareerSimulatorPage"));
const PerformancePage = lazy(() => import("./pages/PerformancePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MatricExamPage = lazy(() => import("./pages/MatricExamPage"));
const MatricStreamPage = lazy(() => import("./pages/MatricStreamPage"));
const MatricYearPage = lazy(() => import("./pages/MatricYearPage"));
const MatricQuizPage = lazy(() => import("./pages/MatricQuizPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const NotesSubjectsPage = lazy(() => import("./pages/NotesSubjectsPage"));
const NotesChaptersPage = lazy(() => import("./pages/NotesChaptersPage"));
const BooksPage = lazy(() => import("./pages/BooksPage"));
const BookSubjectsPage = lazy(() => import("./pages/BookSubjectsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const RoleSelectionPage = lazy(() => import("./pages/RoleSelectionPage"));
const PredictedMatricPage = lazy(() => import("./pages/PredictedMatricPage"));
const PredictedMatricQuizPage = lazy(() => import("./pages/PredictedMatricQuizPage"));
const TeachersDashboard = lazy(() => import("./pages/TeachersDashboard"));
const ExamRoomPage = lazy(() => import("./pages/ExamRoomPage"));
const EthiopianMatricExamPage = lazy(() => import("./pages/EthiopianMatricExamPage"));
const Grade12EUEEPage = lazy(() => import("./pages/Grade12EUEEPage"));
const PastPapersEthiopiaPage = lazy(() => import("./pages/PastPapersEthiopiaPage"));

// Loading component for lazy loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-950 via-violet-900 to-purple-950">
    <div className="flex flex-col items-center gap-4 text-white">
      <Loader2 className="h-12 w-12 animate-spin" />
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-medium">Loading...</span>
        <span className="text-sm text-white/60">Preparing your experience</span>
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes (increased from 5)
      gcTime: 30 * 60 * 1000, // 30 minutes (increased from 10)
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        // Retry up to 3 times for network errors
        if (failureCount < 3) return true;
        return false;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Refetch when coming back online
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations if offline
        if (!navigator.onLine) return false;
        // Retry mutations up to 2 times
        if (failureCount < 2) return true;
        return false;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <NetworkStatusIndicator />
            <NotificationPermissionRequest />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={
                  <Suspense fallback={<PageLoader />}>
                    <Index />
                  </Suspense>
                } />
                <Route path="/grades" element={
                  <RequireAuth>
                    <Suspense fallback={<PageLoader />}>
                      <GradesPage />
                    </Suspense>
                  </RequireAuth>
                } />
                <Route path="/grade/:grade" element={
                  <RequireAuth>
                    <Suspense fallback={<PageLoader />}>
                      <GradeSelection />
                    </Suspense>
                  </RequireAuth>
                } />
                <Route path="/grade/:grade/subjects" element={
                  <RequireAuth>
                    <Suspense fallback={<PageLoader />}>
                      <SubjectsPage />
                    </Suspense>
                  </RequireAuth>
                } />
                <Route
                  path="/grade/:grade/subject/:subject"
                  element={<Navigate to="chapters" replace />}
                />
                <Route path="/grade/:grade/subject/:subject/chapters" element={
                  <RequireAuth>
                    <Suspense fallback={<PageLoader />}>
                      <ChaptersPage />
                    </Suspense>
                  </RequireAuth>
                } />
                <Route path="/grade/:grade/subject/:subject/chapter/:chapterId/difficulty/:difficulty/quiz" element={
                  <RequireAuth>
                    <Suspense fallback={<PageLoader />}>
                      <QuizPage />
                    </Suspense>
                  </RequireAuth>
                } />
                <Route path="/career-simulator" element={
                  <RequireAuth>
                    <Suspense fallback={<PageLoader />}>
                      <CareerSimulatorPage />
                    </Suspense>
                  </RequireAuth>
                } />
                <Route path="/performance" element={
                  <RequireAuth>
                    <Suspense fallback={<PageLoader />}>
                      <PerformancePage />
                    </Suspense>
                  </RequireAuth>
                } />
                <Route path="/profile" element={
                  <RequireAuth>
                    <Suspense fallback={<PageLoader />}>
                      <ProfilePage />
                    </Suspense>
                  </RequireAuth>
                } />
                <Route path="/matric" element={
                  <RequireAuth>
                    <Suspense fallback={<PageLoader />}>
                      <MatricExamPage />
                    </Suspense>
                  </RequireAuth>
                } />
                <Route path="/exam-room" element={
                  <Suspense fallback={<PageLoader />}>
                    <ExamRoomPage />
                  </Suspense>
                } />
                <Route path="/matric/:year" element={
                  <Suspense fallback={<PageLoader />}>
                    <MatricStreamPage />
                  </Suspense>
                } />
                <Route path="/matric/:year/:stream" element={
                  <Suspense fallback={<PageLoader />}>
                    <MatricYearPage />
                  </Suspense>
                } />
                <Route path="/matric/:year/:stream/:subject" element={
                  <Suspense fallback={<PageLoader />}>
                    <MatricQuizPage />
                  </Suspense>
                } />
                <Route path="/notes" element={
                  <Suspense fallback={<PageLoader />}>
                    <NotesPage />
                  </Suspense>
                } />
                <Route path="/notes/:grade" element={
                  <Suspense fallback={<PageLoader />}>
                    <NotesSubjectsPage />
                  </Suspense>
                } />
                <Route path="/notes/:grade/:subject" element={
                  <Suspense fallback={<PageLoader />}>
                    <NotesChaptersPage />
                  </Suspense>
                } />
                <Route path="/books" element={
                  <Suspense fallback={<PageLoader />}>
                    <BooksPage />
                  </Suspense>
                } />
                <Route path="/books/:grade" element={
                  <Suspense fallback={<PageLoader />}>
                    <BookSubjectsPage />
                  </Suspense>
                } />
                <Route path="/contact" element={
                  <Suspense fallback={<PageLoader />}>
                    <ContactPage />
                  </Suspense>
                } />
                <Route path="/select-role" element={
                  <Suspense fallback={<PageLoader />}>
                    <RoleSelectionPage />
                  </Suspense>
                } />
                <Route path="/login" element={
                  <Suspense fallback={<PageLoader />}>
                    <LoginPage />
                  </Suspense>
                } />
                <Route path="/signup" element={
                  <Suspense fallback={<PageLoader />}>
                    <SignUpPage />
                  </Suspense>
                } />
                <Route path="/predicted-matric" element={
                  <Suspense fallback={<PageLoader />}>
                    <PredictedMatricPage />
                  </Suspense>
                } />
                <Route path="/predicted-matric/:stream/:subject" element={
                  <Suspense fallback={<PageLoader />}>
                    <PredictedMatricQuizPage />
                  </Suspense>
                } />
                <Route path="/teachers" element={
                  <Suspense fallback={<PageLoader />}>
                    <TeachersDashboard />
                  </Suspense>
                } />
                <Route path="/ethiopian-matric-exam" element={
                  <Suspense fallback={<PageLoader />}>
                    <EthiopianMatricExamPage />
                  </Suspense>
                } />
                <Route path="/grade-12-euee-exam" element={
                  <Suspense fallback={<PageLoader />}>
                    <Grade12EUEEPage />
                  </Suspense>
                } />
                <Route path="/past-papers-ethiopia" element={
                  <Suspense fallback={<PageLoader />}>
                    <PastPapersEthiopiaPage />
                  </Suspense>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
