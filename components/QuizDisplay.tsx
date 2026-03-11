"use client";
import { useState } from "react";
import type { QuizQuestion, UserAnswer } from "@/types";

interface QuizDisplayProps {
  questions: QuizQuestion[];
  onSubmit: (answers: UserAnswer[]) => void;
}

export default function QuizDisplay({ questions, onSubmit }: QuizDisplayProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const current = questions[currentQuestion];
  const isAnswered = answers[current.id] !== undefined;
  const totalAnswered = Object.keys(answers).length;
  const isLast = currentQuestion === questions.length - 1;

  const handleSelect = (answer: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((n) => n + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) setCurrentQuestion((n) => n - 1);
  };

  const handleSubmitAll = () => {
    // Fill any unanswered questions with empty string
    const final: UserAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));
    setSubmitted(true);
    onSubmit(final);
  };

  const typeLabel = {
    "multiple-choice": "اختيار من متعدد",
    "true-false": "صح أو خطأ",
    "short-answer": "إجابة قصيرة",
  }[current.type];

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-display font-bold text-sm" style={{ color: "var(--color-text-muted)" }}>
          السؤال {currentQuestion + 1} من {questions.length}
        </span>
        <span className="font-display font-bold text-sm" style={{ color: "var(--color-gold)" }}>
          {typeLabel}
        </span>
      </div>
      <div className="w-full h-2 rounded-full mb-6" style={{ background: "var(--color-border)" }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            background: "linear-gradient(90deg, var(--color-primary), var(--color-gold))",
          }}
        />
      </div>

      {/* Question card */}
      <div className="card p-6 mb-5 animate-fade-in" key={current.id}>
        {/* Question number badge */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-white text-base"
            style={{ background: "var(--color-primary)" }}
          >
            {currentQuestion + 1}
          </div>
          <p className="text-lg font-semibold leading-relaxed pt-1" style={{ color: "var(--color-text)" }}>
            {current.question}
          </p>
        </div>

        {/* Options for MCQ and True/False */}
        {(current.type === "multiple-choice" || current.type === "true-false") &&
          current.options && (
            <div className="flex flex-col gap-3">
              {current.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`option-btn ${answers[current.id] === option ? "selected" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

        {/* Textarea for short answer */}
        {current.type === "short-answer" && (
          <textarea
            className="input-field min-h-[120px] resize-none"
            placeholder="اكتب إجابتك هنا..."
            value={answers[current.id] ?? ""}
            onChange={(e) => handleSelect(e.target.value)}
            rows={4}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentQuestion === 0}
          className="btn-secondary"
        >
          ← السابق
        </button>

        {/* Dot navigation */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background:
                  idx === currentQuestion
                    ? "var(--color-primary)"
                    : answers[q.id] !== undefined
                    ? "var(--color-gold)"
                    : "var(--color-border)",
                transform: idx === currentQuestion ? "scale(1.3)" : "scale(1)",
              }}
              title={`سؤال ${idx + 1}`}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={handleSubmitAll}
            disabled={submitted}
            className="btn-primary"
          >
            إنهاء الاختبار ✓
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn-primary"
          >
            التالي →
          </button>
        )}
      </div>

      {/* Bottom status */}
      <p className="text-center text-sm mt-5" style={{ color: "var(--color-text-muted)" }}>
        تمت الإجابة على{" "}
        <span className="font-bold" style={{ color: "var(--color-primary)" }}>
          {totalAnswered}
        </span>{" "}
        من {questions.length} سؤال
        {totalAnswered < questions.length && (
          <span className="mr-2 text-amber-600">· يمكنك تسليم الاختبار في أي وقت</span>
        )}
      </p>
    </div>
  );
}
