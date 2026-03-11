"use client";
import { useState, useCallback } from "react";
import FileUpload from "@/components/FileUpload";
import QuizSettings from "@/components/QuizSettings";
import QuizDisplay from "@/components/QuizDisplay";
import ScoreDisplay from "@/components/ScoreDisplay";
import GeneratingScreen from "@/components/GeneratingScreen";
import type {
  AppStep,
  QuizQuestion,
  QuizSettings as IQuizSettings,
  UserAnswer,
  QuizResult,
  ReviewAnswer,
} from "@/types";

const STEPS: { key: AppStep; label: string }[] = [
  { key: "upload",    label: "رفع الملف" },
  { key: "settings",  label: "الإعدادات" },
  { key: "quiz",      label: "الاختبار" },
  { key: "score",     label: "النتيجة" },
];

function StepIndicator({ current }: { current: AppStep }) {
  const displaySteps = STEPS.filter((s) => s.key !== "generating");
  const currentIndex = displaySteps.findIndex((s) => s.key === current);
  const resolvedIndex = current === "generating" ? 1 : currentIndex;

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {displaySteps.map((step, idx) => {
        const state =
          idx < resolvedIndex
            ? "completed"
            : idx === resolvedIndex
            ? "active"
            : "inactive";
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`step-dot ${state}`}>
                {state === "completed" ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className="text-xs font-display font-semibold hidden sm:block"
                style={{
                  color: state === "active" ? "var(--color-primary)" : "var(--color-text-muted)",
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < displaySteps.length - 1 && (
              <div
                className="w-12 sm:w-20 h-0.5 mx-1 mb-4 transition-colors duration-300"
                style={{
                  background: idx < resolvedIndex ? "var(--color-gold)" : "var(--color-border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [step, setStep]             = useState<AppStep>("upload");
  const [extractedText, setExtractedText] = useState<string>("");
  const [fileName, setFileName]     = useState<string>("");
  const [charCount, setCharCount]   = useState<number>(0);
  const [questions, setQuestions]   = useState<QuizQuestion[]>([]);
  const [result, setResult]         = useState<QuizResult | null>(null);
  const [savedSettings, setSavedSettings] = useState<IQuizSettings | null>(null);
  const [error, setError]           = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Step 1 → 2: file uploaded, text extracted ────────────────────────────
  const handleTextExtracted = useCallback((text: string, name: string) => {
    setExtractedText(text);
    setFileName(name);
    setCharCount(text.length);
    setError("");
    setStep("settings");
  }, []);

  // ── Step 2 → 3: generate quiz via API ────────────────────────────────────
  const handleGenerate = useCallback(
    async (settings: IQuizSettings) => {
      setSavedSettings(settings);
      setIsGenerating(true);
      setStep("generating");
      setError("");

      try {
        const res = await fetch("/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractedText, settings }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "فشل في توليد الاختبار.");
        }

        setQuestions(data.questions);
        setStep("quiz");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "حدث خطأ أثناء توليد الاختبار.";
        setError(msg);
        setStep("settings");
      } finally {
        setIsGenerating(false);
      }
    },
    [extractedText]
  );

  // ── Step 3 → 4: quiz submitted, calculate score ──────────────────────────
  const handleQuizSubmit = useCallback(
    (userAnswers: UserAnswer[]) => {
      const reviewAnswers: ReviewAnswer[] = questions.map((q) => {
        const ua = userAnswers.find((a) => a.questionId === q.id);
        const userAnswer = ua?.answer ?? "";

        let isCorrect = false;
        if (q.type === "short-answer") {
          // For short answer, check if key phrases from the correct answer appear
          const correct = q.correctAnswer.toLowerCase();
          const given   = userAnswer.toLowerCase();
          // Simple heuristic: if user wrote at least 3 chars matching
          isCorrect = given.length >= 3 && correct.includes(given.slice(0, 10));
          // Mark as correct if user answer contains the core of the correct answer
          const keywords = correct.split(/\s+/).filter((w) => w.length > 3);
          const matchCount = keywords.filter((kw) => given.includes(kw)).length;
          isCorrect = matchCount >= Math.ceil(keywords.length * 0.4);
        } else {
          isCorrect =
            userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        }

        return { question: q, userAnswer, isCorrect };
      });

      const correctCount = reviewAnswers.filter((r) => r.isCorrect).length;
      const percentage = Math.round((correctCount / questions.length) * 100);

      setResult({ totalQuestions: questions.length, correctCount, percentage, answers: reviewAnswers });
      setStep("score");
    },
    [questions]
  );

  // ── Retry: same file, new settings ───────────────────────────────────────
  const handleRetry = useCallback(() => {
    setQuestions([]);
    setResult(null);
    setError("");
    setStep("settings");
  }, []);

  // ── Full reset ────────────────────────────────────────────────────────────
  const handleNewFile = useCallback(() => {
    setExtractedText("");
    setFileName("");
    setCharCount(0);
    setQuestions([]);
    setResult(null);
    setSavedSettings(null);
    setError("");
    setStep("upload");
  }, []);

  return (
    <main className="relative z-10 min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* App header (visible on non-upload steps) */}
        {step !== "upload" && (
          <div className="text-center mb-6 animate-fade-in">
            <button onClick={handleNewFile} className="inline-flex items-center gap-2 mb-1">
              <span className="font-display text-xl font-black" style={{ color: "var(--color-primary)" }}>
                مولِّد الاختبارات العربية
              </span>
            </button>
          </div>
        )}

        {/* Step indicator */}
        {step !== "upload" && step !== "generating" && (
          <StepIndicator current={step} />
        )}

        {/* Error banner */}
        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl mb-6 animate-slide-up"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-display font-bold text-sm mb-0.5" style={{ color: "#b91c1c" }}>
                حدث خطأ
              </p>
              <p className="text-sm" style={{ color: "#b91c1c" }}>{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="mr-auto flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Step rendering ── */}
        {step === "upload" && (
          <FileUpload
            onTextExtracted={handleTextExtracted}
            onError={setError}
          />
        )}

        {step === "settings" && (
          <QuizSettings
            fileName={fileName}
            charCount={charCount}
            onGenerate={handleGenerate}
            onBack={handleNewFile}
            isGenerating={isGenerating}
          />
        )}

        {step === "generating" && <GeneratingScreen />}

        {step === "quiz" && questions.length > 0 && (
          <QuizDisplay
            questions={questions}
            onSubmit={handleQuizSubmit}
          />
        )}

        {step === "score" && result && (
          <ScoreDisplay
            result={result}
            onRetry={handleRetry}
            onNewFile={handleNewFile}
          />
        )}
      </div>
    </main>
  );
}
