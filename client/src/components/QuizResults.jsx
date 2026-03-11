// client/src/components/QuizResults.jsx
import React, { useState } from "react";

const DIFFICULTY_LABELS = { easy: "سهل", medium: "متوسط", hard: "صعب" };
const TYPE_LABELS       = { mcq: "اختيار متعدد", truefalse: "صح أم خطأ", shortanswer: "إجابة قصيرة" };

const VERDICT_META = {
  correct:   { label: "صحيحة",   color: "#4CAF7D", bg: "rgba(76,175,125,0.1)",  icon: "✓" },
  partial:   { label: "جزئية",   color: "#F0A500", bg: "rgba(240,165,0,0.1)",   icon: "◑" },
  incorrect: { label: "خاطئة",   color: "#E05C5C", bg: "rgba(224,92,92,0.1)",   icon: "✗" },
};

function ScoreRing({ score, total }) {
  const pct    = total === 0 ? 0 : Math.round((score / total) * 100);
  const radius = 50;
  const circ   = 2 * Math.PI * radius;
  const dash   = (pct / 100) * circ;
  const color  = pct >= 80 ? "#4CAF7D" : pct >= 50 ? "#F0A500" : "#E05C5C";

  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "1.9rem", fontWeight: 800, color, lineHeight: 1 }}>{pct}٪</span>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{score}/{total}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", minWidth: 60 }}>
      <div style={{ fontSize: "1.1rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginTop: 1 }}>{label}</div>
    </div>
  );
}

/**
 * Props:
 *   questions    array
 *   userAnswers  { [i]: string }
 *   grades       { [i]: { verdict, score, feedback } }  ← AI-graded short answers
 *   config       { questionType, difficulty }
 *   onRetry      fn
 */
export default function QuizResults({ questions, userAnswers, grades = {}, config, onRetry }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  // Auto-graded score (MCQ + T/F)
  const autoScore = questions.reduce((acc, q, i) => {
    if (q.type === "shortanswer") return acc;
    return acc + (userAnswers[i] === q.answer ? 1 : 0);
  }, 0);

  // AI-graded score (short answers)
  const aiScore = Object.values(grades).reduce((acc, g) => acc + (g.score || 0), 0);

  const gradedAuto  = questions.filter((q) => q.type !== "shortanswer").length;
  const gradedAI    = Object.keys(grades).length;
  const totalGraded = gradedAuto + gradedAI;
  const totalScore  = autoScore + aiScore;
  const pct         = totalGraded === 0 ? 0 : Math.round((totalScore / totalGraded) * 100);

  const gradeLabel =
    pct >= 90 ? { label: "ممتاز 🏆",           color: "#4CAF7D" } :
    pct >= 75 ? { label: "جيد جداً ✨",          color: "#7DD8B0" } :
    pct >= 60 ? { label: "جيد 👍",              color: "#F0A500" } :
    pct >= 40 ? { label: "مقبول 📚",            color: "#D4900A" } :
               { label: "يحتاج مراجعة 📖",      color: "#E05C5C" };

  return (
    <div className="animate-fade-in" style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}>

      {/* ── Score header ────────────────────────────────────────────────── */}
      <div className="card card-accent" style={{ textAlign: "center", marginBottom: "1.5rem", padding: "2.5rem 2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
          <ScoreRing score={totalScore} total={totalGraded} />

          <div>
            <h2 style={{ margin: 0, fontSize: "1.6rem", color: gradeLabel.color }}>{gradeLabel.label}</h2>
            {gradedAI > 0 && (
              <p style={{ margin: "0.4rem 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                يشمل تقييم {gradedAI} إجابة قصيرة بالذكاء الاصطناعي
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Stat label="صحيح"    value={autoScore}                            color="#4CAF7D" />
            <Stat label="خاطئ"    value={gradedAuto - autoScore}               color="#E05C5C" />
            {gradedAI > 0 && <Stat label="قصيرة (AI)" value={`${aiScore}/${gradedAI}`} color="#F0A500" />}
            <Stat label="المجموع" value={questions.length}                      color="var(--gold-400)" />
            <Stat label="الصعوبة" value={DIFFICULTY_LABELS[config.difficulty] || ""} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      {/* ── Per-question review ──────────────────────────────────────────── */}
      <h3 style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        مراجعة الإجابات
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {questions.map((q, i) => {
          const ua       = userAnswers[i];
          const isShort  = q.type === "shortanswer";
          const grade    = grades[i];   // AI grade for short answers
          const isCorrect = isShort ? null : ua === q.answer;
          const expanded  = expandedIdx === i;

          // Determine card border color
          let borderColor = "rgba(240,165,0,0.2)";
          if (!isShort) borderColor = isCorrect ? "rgba(76,175,125,0.35)" : "rgba(224,92,92,0.35)";
          else if (grade) borderColor = VERDICT_META[grade.verdict]?.bg
            ?.replace("0.1)", "0.35)") || borderColor;

          // Status icon element
          let statusEl;
          if (isShort && grade) {
            const vm = VERDICT_META[grade.verdict];
            statusEl = <span style={{ fontSize: "0.9rem", color: vm.color, fontWeight: 800 }}>{vm.icon}</span>;
          } else if (isShort) {
            statusEl = <span style={{ fontSize: "0.8rem", color: "var(--gold-400)" }}>✎</span>;
          } else if (isCorrect) {
            statusEl = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
          } else {
            statusEl = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E05C5C" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
          }

          return (
            <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="card" style={{ padding: "1rem 1.25rem", cursor: "pointer", borderColor }}
                   onClick={() => setExpandedIdx(expanded ? null : i)}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: isShort && grade ? VERDICT_META[grade.verdict]?.bg : isCorrect === null ? "rgba(240,165,0,0.12)" : isCorrect ? "rgba(76,175,125,0.15)" : "rgba(224,92,92,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {statusEl}
                  </div>
                  <p style={{ margin: 0, flex: 1, fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5 }}>
                    {i + 1}. {q.question}
                  </p>
                  {isShort && grade && (
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: VERDICT_META[grade.verdict]?.color, background: VERDICT_META[grade.verdict]?.bg, padding: "0.15rem 0.6rem", borderRadius: 999, flexShrink: 0 }}>
                      {VERDICT_META[grade.verdict]?.label}
                    </span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"
                       style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                {expanded && (
                  <div className="animate-fade-in" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>

                    {/* User answer */}
                    <div style={{ marginBottom: "0.6rem" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700 }}>إجابتك: </span>
                      <span style={{ color: isShort ? "var(--text-primary)" : isCorrect ? "#7DD8B0" : "#F09090", fontWeight: 600, fontSize: "0.9rem" }}>
                        {ua ? (q.options ? `${ua} — ${q.options[ua] || ua}` : ua) : "لم تُجب"}
                      </span>
                    </div>

                    {/* Model answer */}
                    {(!isCorrect || isShort) && (
                      <div style={{ marginBottom: "0.6rem" }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700 }}>الإجابة الصحيحة: </span>
                        <span style={{ color: "#7DD8B0", fontWeight: 600, fontSize: "0.9rem" }}>
                          {q.options ? `${q.answer} — ${q.options[q.answer] || q.answer}` : q.answer}
                        </span>
                      </div>
                    )}

                    {/* AI feedback for short answers */}
                    {isShort && grade && (
                      <div style={{ marginBottom: "0.75rem", padding: "0.7rem 1rem", background: VERDICT_META[grade.verdict]?.bg, border: `1px solid ${VERDICT_META[grade.verdict]?.color}40`, borderRadius: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.82rem", color: VERDICT_META[grade.verdict]?.color }}>
                          🤖 تقييم الذكاء الاصطناعي ({VERDICT_META[grade.verdict]?.label}):
                        </span>
                        <p style={{ margin: "0.3rem 0 0", fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                          {grade.feedback}
                        </p>
                      </div>
                    )}

                    {/* Explanation */}
                    <div style={{ padding: "0.75rem 1rem", background: "rgba(240,165,0,0.06)", border: "1px solid rgba(240,165,0,0.18)", borderRadius: 8, fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.7 }}>
                      <span style={{ fontWeight: 700, color: "var(--gold-400)" }}>💡 الشرح: </span>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
        <button className="btn-primary" onClick={onRetry} style={{ gap: "0.5rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.56"/>
          </svg>
          اختبار جديد
        </button>
      </div>
    </div>
  );
}
