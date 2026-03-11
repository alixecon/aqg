// ResultsPage.jsx
// الفلسفة: الصدق يبني الثقة — أخبر الطالب بالحقيقة بشكل بنّاء
// هذه الصفحة هي لحظة "الذروة" التي يتذكرها ويشاركها (word of mouth)

import React, { useState, useMemo } from "react";

function scoreColor(pct) {
  if (pct >= 80) return "#3DBF7A";
  if (pct >= 60) return "var(--accent)";
  return "#E05C5C";
}

function scoreLabel(pct) {
  if (pct >= 90) return "ممتاز";
  if (pct >= 80) return "جيد جداً";
  if (pct >= 70) return "جيد";
  if (pct >= 60) return "مقبول";
  if (pct >= 40) return "يحتاج مراجعة";
  return "راجع المادة من البداية";
}

function feedbackLine(pct) {
  if (pct >= 90) return "تمكّنت من المادة بشكل ممتاز — واصل";
  if (pct >= 75) return "أداء جيد، لكن هناك أسئلة تستحق المراجعة أدناه";
  if (pct >= 50) return "تغطية جزئية للمادة — ركّز على الأسئلة التي أخطأت فيها";
  return "النتيجة تقول إن المادة تحتاج مراجعة شاملة — ابدأ من الأسئلة أدناه";
}

export default function ResultsPage({ questions, userAnswers, grades, config, onRetry }) {
  const [openIdx, setOpenIdx] = useState(null);

  const isSA = config.questionType === "shortanswer";
  const isTF = config.questionType === "truefalse";

  const { score, total, pct } = useMemo(() => {
    let s = 0, t = questions.length;
    questions.forEach((q, i) => {
      const ans = userAnswers[i];
      if (!ans) return;
      if (isSA) {
        const v = grades[i]?.verdict;
        if (v === "correct") s += 1;
        else if (v === "partial") s += 0.5;
      } else {
        const correct = isTF
          ? (q.correctAnswer === true || q.correctAnswer === "صحيح" ? 0 : 1)
          : q.correctAnswer;
        if (ans.picked === correct) s += 1;
      }
    });
    return { score: s, total: t, pct: t > 0 ? Math.round((s / t) * 100) : 0 };
  }, [questions, userAnswers, grades, isSA, isTF]);

  const color = scoreColor(pct);

  // تصدير النتائج كنص
  function exportTxt() {
    const lines = [
      `نتيجة الاختبار — ${new Date().toLocaleDateString("ar-SA")}`,
      `النتيجة: ${score}/${total} (${pct}٪)`,
      `التقدير: ${scoreLabel(pct)}`,
      "", "─".repeat(40), "",
    ];
    questions.forEach((q, i) => {
      const ans = userAnswers[i];
      lines.push(`س${i + 1}: ${q.question}`);
      if (isSA) {
        lines.push(`إجابتك: ${ans?.text || "—"}`);
        lines.push(`الإجابة النموذجية: ${q.correctAnswer}`);
        if (grades[i]) lines.push(`التقييم: ${grades[i].verdict === "correct" ? "صحيح" : grades[i].verdict === "partial" ? "جزئي" : "خاطئ"}`);
      } else {
        const opts = q.options || (isTF ? ["صحيح","خاطئ"] : []);
        const correct = isTF ? (q.correctAnswer === true || q.correctAnswer === "صحيح" ? 0 : 1) : q.correctAnswer;
        lines.push(`إجابتك: ${opts[ans?.picked] || "—"}`);
        lines.push(`الإجابة الصحيحة: ${opts[correct] || ""}`);
        if (ans?.picked === correct) lines.push("✓ صحيح");
        else lines.push("✗ خاطئ");
      }
      if (q.explanation) lines.push(`الشرح: ${q.explanation}`);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `quiz-results-${Date.now()}.txt`; a.click();
  }

  return (
    <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Score hero — الصدق أولاً ── */}
      <div style={{
        textAlign: "center", padding: "3rem 2rem",
        background: "var(--ink-800)", border: "1px solid var(--border)",
        borderRadius: "var(--r2)", position: "relative", overflow: "hidden",
      }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* Score circle */}
        <div style={{ position: "relative", display: "inline-flex", marginBottom: "1.5rem" }}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="70" cy="70" r="58" fill="none" stroke="var(--ink-600)" strokeWidth="8"/>
            <circle cx="70" cy="70" r="58" fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - pct / 100)}`}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>{pct}٪</span>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.2rem" }}>
              {score.toLocaleString("ar")}/{total.toLocaleString("ar")}
            </span>
          </div>
        </div>

        <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--white)", marginBottom: "0.5rem" }}>
          {scoreLabel(pct)}
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", maxWidth: 380, margin: "0 auto" }}>
          {feedbackLine(pct)}
        </p>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={onRetry} className="btn btn-accent" style={{ flex: 1, padding: "0.9rem", borderRadius: "var(--r)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
          اختبر مرة أخرى
        </button>
        <button onClick={exportTxt} className="btn btn-ghost" style={{ padding: "0.9rem 1.25rem", borderRadius: "var(--r)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          تصدير
        </button>
      </div>

      {/* ── Review accordion ── */}
      <div>
        <h2 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.85rem" }}>
          مراجعة الأسئلة
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {questions.map((q, i) => {
            const ans     = userAnswers[i];
            const opts    = q.options || (isTF ? ["صحيح","خاطئ"] : []);
            const correct = isTF ? (q.correctAnswer === true || q.correctAnswer === "صحيح" ? 0 : 1) : q.correctAnswer;
            const verdict = isSA ? grades[i]?.verdict : ans?.picked === correct ? "correct" : "wrong";
            const isOpen  = openIdx === i;

            const statusColor = verdict === "correct" ? "#3DBF7A" : verdict === "partial" ? "var(--accent)" : "#E05C5C";
            const statusIcon  = verdict === "correct" ? "✓" : verdict === "partial" ? "~" : "✗";
            const statusLabel = verdict === "correct" ? "صحيح" : verdict === "partial" ? "جزئي" : "خاطئ";

            return (
              <div key={i} style={{ border: `1px solid ${isOpen ? statusColor + "50" : "var(--border)"}`, borderRadius: "var(--r)", background: "var(--ink-800)", overflow: "hidden", transition: "border-color 0.2s" }}>
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{
                    width: "100%", padding: "1rem 1.25rem",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "right",
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: `${statusColor}18`, border: `1px solid ${statusColor}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 900, color: statusColor,
                  }}>{statusIcon}</span>
                  <span style={{ flex: 1, fontSize: "0.9rem", fontFamily: "Cairo, sans-serif", color: "var(--white)", fontWeight: 500, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {q.question}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontFamily: "Cairo, sans-serif", color: statusColor, fontWeight: 700, flexShrink: 0 }}>{statusLabel}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none", flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {isOpen && (
                  <div className="anim-fade" style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border)" }}>
                    <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

                      {isSA ? (
                        <>
                          <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, marginBottom: "0.3rem" }}>إجابتك</div>
                            <div style={{ fontSize: "0.9rem", color: "var(--white)", lineHeight: 1.65 }}>{ans?.text || "—"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, marginBottom: "0.3rem" }}>الإجابة النموذجية</div>
                            <div style={{ fontSize: "0.9rem", color: "#3DBF7A", lineHeight: 1.65 }}>{q.correctAnswer}</div>
                          </div>
                          {grades[i]?.feedback && (
                            <div style={{ padding: "0.75rem 1rem", background: "var(--ink-700)", borderRadius: "var(--r)", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.65, borderRight: "3px solid var(--accent)" }}>
                              {grades[i].feedback}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          {opts.map((o, oi) => {
                            const isC = oi === correct;
                            const isP = oi === ans?.picked;
                            let bg = "transparent", color = "var(--muted)", bdr = "transparent";
                            if (isC)          { bg = "rgba(61,191,122,0.08)"; color = "#6FDDA8"; bdr = "rgba(61,191,122,0.3)"; }
                            if (isP && !isC)  { bg = "rgba(224,92,92,0.07)"; color = "#F09090"; bdr = "rgba(224,92,92,0.25)"; }
                            return (
                              <div key={oi} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.55rem 0.8rem", borderRadius: 8, background: bg, border: `1px solid ${bdr}` }}>
                                <span style={{ fontSize: "0.8rem", fontWeight: 900, color }}>{isC ? "✓" : isP ? "✗" : "·"}</span>
                                <span style={{ fontSize: "0.88rem", fontFamily: "Cairo, sans-serif", color, fontWeight: isC || isP ? 700 : 400 }}>{o}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.explanation && (
                        <div style={{ padding: "0.75rem 1rem", background: "var(--ink-700)", borderRadius: "var(--r)", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.65, borderRight: "3px solid var(--border-hi)" }}>
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}