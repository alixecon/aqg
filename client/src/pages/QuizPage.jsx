// client/src/pages/QuizPage.jsx
import React, { useState } from "react";
import QuizQuestion from "../components/QuizQuestion";

export default function QuizPage({ questions, config, onFinish, onBack }) {
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [userAnswers, setUserAnswers]  = useState({});
  const [revealed,    setRevealed]     = useState(false); // current Q answer shown
  const [grading,     setGrading]      = useState(false);

  const total    = questions.length;
  const currentQ = questions[currentIdx];
  const isLast   = currentIdx === total - 1;

  // Single answer handler — covers MCQ, T/F, and short-answer
  function handleAnswer(answer) {
    if (revealed) return;
    setUserAnswers((prev) => ({ ...prev, [currentIdx]: answer }));
    if (currentQ.type !== "shortanswer") setRevealed(true);
  }

  // Short-answer confirm button
  function handleConfirmShort() {
    if (userAnswers[currentIdx] !== undefined) setRevealed(true);
  }

  function handleNext() {
    if (isLast) {
      submitQuiz();
    } else {
      setCurrentIdx((i) => i + 1);
      setRevealed(false);
    }
  }

  function handleSkip() {
    if (isLast) submitQuiz();
    else { setCurrentIdx((i) => i + 1); setRevealed(false); }
  }

  async function submitQuiz() {
    const hasShortAnswers = questions.some((q) => q.type === "shortanswer");
    if (!hasShortAnswers) { onFinish(userAnswers, {}); return; }

    setGrading(true);
    try {
      const res  = await fetch("/api/grade", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, userAnswers }),
      });
      const data = await res.json();
      onFinish(userAnswers, res.ok ? (data.grades || {}) : {});
    } catch {
      onFinish(userAnswers, {});
    }
  }

  const DIFF_COLORS = { easy: "#4CAF7D", medium: "#F0A500", hard: "#E05C5C" };
  const DIFF_LABELS = { easy: "سهل", medium: "متوسط", hard: "صعب" };
  const TYPE_LABELS = { mcq: "اختيار متعدد", truefalse: "صح أم خطأ", shortanswer: "إجابة قصيرة" };

  const answeredCount = Object.keys(userAnswers).length;
  const pct           = Math.round((answeredCount / total) * 100);
  const remaining     = total - answeredCount;

  if (grading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ width: 56, height: 56, border: "3px solid rgba(240,165,0,0.2)", borderTopColor: "var(--gold-500)", borderRadius: "50%", margin: "0 auto 1.5rem", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>جاري تقييم إجاباتك بالذكاء الاصطناعي…</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>هذا قد يستغرق بضع ثوانٍ</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem" }}>
        <button className="btn-ghost" onClick={onBack} style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          خروج
        </button>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className="badge badge-gold">{TYPE_LABELS[config.questionType]}</span>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "0.2rem 0.75rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700, background: `${DIFF_COLORS[config.difficulty]}18`, color: DIFF_COLORS[config.difficulty], border: `1px solid ${DIFF_COLORS[config.difficulty]}40` }}>
            {DIFF_LABELS[config.difficulty]}
          </span>
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.55rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: pct === 100 ? "#4CAF7D" : "var(--gold-400)", fontFamily: "Cairo, sans-serif", transition: "color 0.4s" }}>
            {pct === 100 ? "✓ اكتملت جميع الإجابات" : `تمّت الإجابة على ${answeredCount} من ${total}`}
          </span>
          <span style={{ fontSize: "1rem", fontWeight: 900, color: pct === 100 ? "#4CAF7D" : "var(--gold-400)", fontFamily: "Cairo, sans-serif", transition: "color 0.4s" }}>
            {pct}٪
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", border: "1px solid rgba(245,200,66,0.1)" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: pct === 100 ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,var(--gold-500),var(--gold-300))", transition: "width 0.5s cubic-bezier(0.4,0,0.2,1),background 0.4s", boxShadow: pct === 100 ? "0 0 12px rgba(74,222,128,0.4)" : "0 0 10px rgba(230,168,0,0.35)" }} />
        </div>
        {remaining > 0 && (
          <p style={{ marginTop: "0.45rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", fontFamily: "Cairo, sans-serif" }}>
            {remaining === 1 ? "سؤال واحد متبقٍّ" : `${remaining} أسئلة متبقية`}
          </p>
        )}
      </div>

      {/* ── Question ─────────────────────────────────────────────────────── */}
      <QuizQuestion
        key={currentIdx}
        question={currentQ}
        index={currentIdx}
        total={total}
        onAnswer={handleAnswer}
        submitted={revealed}
        userAnswer={userAnswers[currentIdx] ?? null}
      />

      {/* Short-answer confirm button */}
      {currentQ.type === "shortanswer" && !revealed && userAnswers[currentIdx] && (
        <button className="btn-primary animate-slide-up" onClick={handleConfirmShort}
          style={{ marginTop: "1rem", width: "100%" }}>
          تأكيد الإجابة
        </button>
      )}

      {/* Explanation for MCQ/TF */}
      {revealed && currentQ.type !== "shortanswer" && currentQ.explanation && (
        <div className="animate-slide-up" style={{ marginTop: "1rem", padding: "0.9rem 1.1rem", background: "rgba(240,165,0,0.06)", border: "1px solid rgba(240,165,0,0.2)", borderRadius: 10, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.7 }}>
          <span style={{ fontWeight: 700, color: "var(--gold-400)" }}>💡 الشرح: </span>
          {currentQ.explanation}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.75rem", gap: "1rem" }}>
        {!revealed && (
          <button className="btn-ghost" onClick={handleSkip} style={{ fontSize: "0.88rem" }}>
            تخطّي
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
            </svg>
          </button>
        )}
        {revealed && <div />}
        {revealed && (
          <button className="btn-primary animate-slide-up" onClick={handleNext}>
            {isLast ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> عرض النتائج</>
            ) : (
              <>السؤال التالي <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
