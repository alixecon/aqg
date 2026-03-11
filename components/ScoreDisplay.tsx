"use client";
import { useEffect, useRef } from "react";
import type { QuizResult } from "@/types";

interface ScoreDisplayProps {
  result: QuizResult;
  onRetry: () => void;
  onNewFile: () => void;
}

function ScoreRing({ percentage }: { percentage: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 80 ? "#15803d" : percentage >= 50 ? "#b45309" : "#b91c1c";

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {/* Background ring */}
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      {/* Progress ring */}
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="score-ring"
        transform="rotate(-90 70 70)"
      />
      {/* Percentage text */}
      <text x="70" y="65" textAnchor="middle" className="font-display" fontSize="28" fontWeight="900" fill={color}>
        {percentage}٪
      </text>
      <text x="70" y="85" textAnchor="middle" fontSize="12" fill="#6b7280" fontFamily="Noto Naskh Arabic">
        النتيجة
      </text>
    </svg>
  );
}

export default function ScoreDisplay({ result, onRetry, onNewFile }: ScoreDisplayProps) {
  const { totalQuestions, correctCount, percentage, answers } = result;

  const grade =
    percentage >= 90
      ? { label: "ممتاز 🏆", color: "#15803d", bg: "#f0fdf4" }
      : percentage >= 75
      ? { label: "جيد جداً ⭐", color: "#1d4ed8", bg: "#eff6ff" }
      : percentage >= 60
      ? { label: "جيد 👍", color: "#b45309", bg: "#fffbeb" }
      : percentage >= 50
      ? { label: "مقبول 📚", color: "#7c3aed", bg: "#f5f3ff" }
      : { label: "يحتاج مراجعة 💪", color: "#b91c1c", bg: "#fef2f2" };

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      {/* Score hero */}
      <div className="card p-8 mb-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <ScoreRing percentage={percentage} />

          <div>
            <div
              className="inline-block px-5 py-2 rounded-full font-display font-black text-lg mb-3"
              style={{ background: grade.bg, color: grade.color }}
            >
              {grade.label}
            </div>
            <p className="text-2xl font-display font-bold" style={{ color: "var(--color-text)" }}>
              أجبت على{" "}
              <span style={{ color: "var(--color-primary)" }}>{correctCount}</span>
              {" "}من{" "}
              <span style={{ color: "var(--color-primary)" }}>{totalQuestions}</span>
              {" "}سؤالاً بشكل صحيح
            </p>
          </div>

          <div className="flex gap-4 mt-2">
            <button onClick={onRetry} className="btn-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              اختبار جديد بنفس الملف
            </button>
            <button onClick={onNewFile} className="btn-secondary">
              رفع ملف آخر
            </button>
          </div>
        </div>
      </div>

      {/* Answers review */}
      <h2 className="font-display text-xl font-black mb-4" style={{ color: "var(--color-primary)" }}>
        مراجعة الإجابات
      </h2>

      <div className="flex flex-col gap-4">
        {answers.map((item, idx) => (
          <div
            key={item.question.id}
            className="card p-5 animate-fade-in"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {/* Question header */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-display font-black text-white"
                style={{
                  background: item.isCorrect ? "#15803d" : "#b91c1c",
                }}
              >
                {item.isCorrect ? "✓" : "✗"}
              </div>
              <p className="font-semibold text-base leading-relaxed pt-0.5" style={{ color: "var(--color-text)" }}>
                {item.question.question}
              </p>
            </div>

            <div className="grid gap-2 text-sm">
              {/* User answer */}
              <div
                className="flex items-start gap-2 p-3 rounded-lg"
                style={{
                  background: item.isCorrect ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${item.isCorrect ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <span className="font-bold flex-shrink-0" style={{ color: item.isCorrect ? "#15803d" : "#b91c1c" }}>
                  إجابتك:
                </span>
                <span style={{ color: item.isCorrect ? "#15803d" : "#b91c1c" }}>
                  {item.userAnswer || <em style={{ opacity: 0.7 }}>لم تتم الإجابة</em>}
                </span>
              </div>

              {/* Correct answer (show always if wrong) */}
              {!item.isCorrect && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <span className="font-bold flex-shrink-0 text-green-700">الإجابة الصحيحة:</span>
                  <span className="text-green-700">{item.question.correctAnswer}</span>
                </div>
              )}

              {/* Explanation */}
              {item.question.explanation && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg"
                  style={{ background: "rgba(15,76,92,0.05)", border: "1px solid rgba(15,76,92,0.12)" }}
                >
                  <span className="font-bold flex-shrink-0" style={{ color: "var(--color-primary)" }}>
                    💡 الشرح:
                  </span>
                  <span style={{ color: "var(--color-text)" }}>{item.question.explanation}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="flex gap-4 mt-8 mb-4">
        <button onClick={onRetry} className="btn-primary flex-1 py-4">
          اختبار جديد بنفس الملف
        </button>
        <button onClick={onNewFile} className="btn-secondary flex-1 py-4">
          رفع ملف آخر
        </button>
      </div>
    </div>
  );
}
