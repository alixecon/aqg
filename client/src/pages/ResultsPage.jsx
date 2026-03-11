// client/src/pages/ResultsPage.jsx
import React, { useState } from "react";
import QuizResults from "../components/QuizResults";

export default function ResultsPage({ questions, userAnswers, grades, config, onRetry }) {

  // ── Export as plain text ─────────────────────────────────────────────────
  function handleExport() {
    const lines = [];
    lines.push("نتائج الاختبار — مولّد الاختبارات العربي");
    lines.push("=".repeat(45));
    lines.push("");

    questions.forEach((q, i) => {
      lines.push(`السؤال ${i + 1}: ${q.question}`);

      if (q.options) {
        Object.entries(q.options).forEach(([key, val]) => {
          lines.push(`  ${key}) ${val}`);
        });
      }

      const ua = userAnswers[i];
      lines.push(`إجابتك: ${ua || "—"}`);
      lines.push(`الإجابة الصحيحة: ${q.answer}`);

      // Short answer grade
      if (q.type === "shortanswer" && grades?.[i]) {
        const g = grades[i];
        const verdictAr = g.verdict === "correct" ? "صحيحة" : g.verdict === "partial" ? "جزئية" : "خاطئة";
        lines.push(`التقييم: ${verdictAr}`);
        lines.push(`ملاحظة: ${g.feedback}`);
      }

      lines.push(`الشرح: ${q.explanation}`);
      lines.push("-".repeat(40));
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "نتائج_الاختبار.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>

      {/* ── Page title + export button ──────────────────────────────────── */}
      <div className="animate-slide-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 900, margin: "0 0 0.4rem", background: "linear-gradient(135deg, var(--gold-300), var(--gold-500))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            نتيجة الاختبار
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
            راجع إجاباتك وتعلّم من الشرح المفصّل
          </p>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(240,165,0,0.08)",
            border: "1px solid rgba(240,165,0,0.3)",
            borderRadius: 8, padding: "0.55rem 1rem",
            color: "var(--gold-400)", fontFamily: "Cairo, sans-serif",
            fontSize: "0.88rem", fontWeight: 700, cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(240,165,0,0.14)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(240,165,0,0.08)"}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          تصدير النتائج
        </button>
      </div>

      <QuizResults
        questions={questions}
        userAnswers={userAnswers}
        grades={grades}
        config={config}
        onRetry={onRetry}
      />
    </div>
  );
}
