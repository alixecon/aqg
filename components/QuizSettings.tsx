"use client";
import { useState } from "react";
import type { QuizSettings, QuestionType, Difficulty } from "@/types";

interface QuizSettingsProps {
  fileName: string;
  charCount?: number;
  onGenerate: (settings: QuizSettings) => void;
  onBack: () => void;
  isGenerating: boolean;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string; desc: string }[] = [
  { value: "multiple-choice", label: "اختيار من متعدد", icon: "☑️", desc: "4 خيارات لكل سؤال" },
  { value: "true-false",      label: "صح أو خطأ",      icon: "✅", desc: "عبارات للتحقق" },
  { value: "short-answer",    label: "إجابة قصيرة",    icon: "✍️", desc: "إجابة بجملة أو جملتين" },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string; desc: string }[] = [
  { value: "easy",   label: "سهل",   color: "#15803d", desc: "أسئلة مباشرة للحفظ" },
  { value: "medium", label: "متوسط", color: "#b45309", desc: "فهم وتحليل" },
  { value: "hard",   label: "صعب",   color: "#b91c1c", desc: "تحليل نقدي واستنتاج" },
];

export default function QuizSettings({
  fileName,
  charCount,
  onGenerate,
  onBack,
  isGenerating,
}: QuizSettingsProps) {
  const [settings, setSettings] = useState<QuizSettings>({
    numQuestions: 5,
    questionType: "multiple-choice",
    difficulty: "medium",
  });

  const handleSubmit = () => {
    if (!isGenerating) onGenerate(settings);
  };

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      {/* File info banner */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-8"
        style={{ background: "rgba(15,76,92,0.07)", border: "1px solid rgba(15,76,92,0.15)" }}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ background: "var(--color-primary)", color: "white" }}
        >
          📄
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold truncate" style={{ color: "var(--color-primary)" }}>
            {fileName}
          </p>
          {charCount && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              تم استخراج {charCount.toLocaleString("ar-EG")} حرف بنجاح ✓
            </p>
          )}
        </div>
        <button onClick={onBack} className="btn-secondary text-sm px-3 py-1.5 flex-shrink-0">
          تغيير الملف
        </button>
      </div>

      <h2 className="font-display text-2xl font-black mb-6" style={{ color: "var(--color-primary)" }}>
        إعدادات الاختبار
      </h2>

      {/* Number of questions */}
      <div className="card p-6 mb-5">
        <label className="font-display font-bold text-base mb-4 block" style={{ color: "var(--color-text)" }}>
          عدد الأسئلة
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSettings((s) => ({ ...s, numQuestions: Math.max(1, s.numQuestions - 1) }))}
            className="w-10 h-10 rounded-xl border-2 font-bold text-xl flex items-center justify-center transition-colors"
            style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
          >
            −
          </button>
          <div
            className="flex-1 text-center py-2 rounded-xl font-display text-3xl font-black"
            style={{ color: "var(--color-primary)", background: "rgba(15,76,92,0.06)" }}
          >
            {settings.numQuestions}
          </div>
          <button
            onClick={() => setSettings((s) => ({ ...s, numQuestions: Math.min(20, s.numQuestions + 1) }))}
            className="w-10 h-10 rounded-xl border-2 font-bold text-xl flex items-center justify-center transition-colors"
            style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
          >
            +
          </button>
        </div>
        {/* Quick presets */}
        <div className="flex gap-2 mt-4 justify-center flex-wrap">
          {[3, 5, 10, 15, 20].map((n) => (
            <button
              key={n}
              onClick={() => setSettings((s) => ({ ...s, numQuestions: n }))}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                settings.numQuestions === n ? "text-white" : ""
              }`}
              style={{
                background: settings.numQuestions === n ? "var(--color-primary)" : "rgba(15,76,92,0.08)",
                color: settings.numQuestions === n ? "white" : "var(--color-primary)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Question type */}
      <div className="card p-6 mb-5">
        <label className="font-display font-bold text-base mb-4 block" style={{ color: "var(--color-text)" }}>
          نوع الأسئلة
        </label>
        <div className="grid grid-cols-3 gap-3">
          {QUESTION_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setSettings((s) => ({ ...s, questionType: t.value }))}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                settings.questionType === t.value ? "" : "hover:border-current"
              }`}
              style={{
                borderColor:
                  settings.questionType === t.value ? "var(--color-primary)" : "var(--color-border)",
                background:
                  settings.questionType === t.value ? "rgba(15,76,92,0.07)" : "var(--color-surface)",
              }}
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <div
                className="font-display font-bold text-sm"
                style={{
                  color:
                    settings.questionType === t.value ? "var(--color-primary)" : "var(--color-text)",
                }}
              >
                {t.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {t.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="card p-6 mb-8">
        <label className="font-display font-bold text-base mb-4 block" style={{ color: "var(--color-text)" }}>
          مستوى الصعوبة
        </label>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setSettings((s) => ({ ...s, difficulty: d.value }))}
              className="p-4 rounded-xl border-2 text-center transition-all"
              style={{
                borderColor: settings.difficulty === d.value ? d.color : "var(--color-border)",
                background:
                  settings.difficulty === d.value ? `${d.color}12` : "var(--color-surface)",
              }}
            >
              <div
                className="font-display font-bold text-base"
                style={{ color: settings.difficulty === d.value ? d.color : "var(--color-text)" }}
              >
                {d.label}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                {d.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleSubmit}
        disabled={isGenerating}
        className="btn-primary w-full py-4 text-lg gap-3"
      >
        {isGenerating ? (
          <>
            <span
              className="w-5 h-5 rounded-full border-2 border-white border-t-transparent inline-block"
              style={{ animation: "spin 0.9s linear infinite" }}
            />
            تتم صياغة الاسئلة...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            اختبرني 
          </>
        )}
      </button>
    </div>
  );
}
