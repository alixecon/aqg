// QuizPage.jsx — تجربة الاختبار الفعلية
// الفلسفة: لا ضجيج، الإجابة تأتي والتغذية الراجعة فورية وصادقة

import React, { useState, useEffect, useRef } from "react";

export default function QuizPage({ questions, config, onFinish, onBack }) {
  const [idx,        setIdx]        = useState(0);
  const [answers,    setAnswers]     = useState({});
  const [picked,     setPicked]      = useState(null);
  const [revealed,   setRevealed]    = useState(false);
  const [shortText,  setShortText]   = useState("");
  const [finishing,  setFinishing]   = useState(false);
  const textRef = useRef(null);

  const q    = questions[idx];
  const isMCQ = config.questionType === "mcq";
  const isTF  = config.questionType === "truefalse";
  const isSA  = config.questionType === "shortanswer";
  const total = questions.length;
  const pct   = ((idx) / total) * 100;

  useEffect(() => { setPicked(null); setRevealed(false); setShortText(""); }, [idx]);

  function choose(i) {
    if (revealed) return;
    setPicked(i); setRevealed(true);
    setAnswers(a => ({ ...a, [idx]: { picked: i, text: null } }));
  }

  function submitShort() {
    if (!shortText.trim() || revealed) return;
    setRevealed(true);
    setAnswers(a => ({ ...a, [idx]: { picked: null, text: shortText.trim() } }));
  }

  async function finish() {
    const finalAnswers = { ...answers };
    if (revealed && isSA) finalAnswers[idx] = { picked: null, text: shortText.trim() };

    setFinishing(true);
    let grades = {};
    const shortQs = questions
      .map((q, i) => ({ q, i, ans: finalAnswers[i]?.text }))
      .filter(x => x.ans);

    if (shortQs.length > 0) {
      try {
        const res = await fetch("/api/grade", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: shortQs.map(x => ({ question: x.q.question, correctAnswer: x.q.correctAnswer, userAnswer: x.ans })) }),
        });
        const data = await res.json();
        if (res.ok && data.grades) {
          shortQs.forEach((x, gi) => { grades[x.i] = data.grades[gi]; });
        }
      } catch {}
    }
    onFinish(finalAnswers, grades);
  }

  function next() {
    if (idx < total - 1) setIdx(i => i + 1);
    else finish();
  }

  if (!q) return null;

  const opts   = q.options || (isTF ? ["صحيح", "خطأ"] : []);
  const correct = isTF ? (q.correctAnswer === true || q.correctAnswer === "صحيح" ? 0 : 1) : q.correctAnswer;

  return (
    <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Progress ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.82rem", fontFamily: "Cairo, sans-serif", display: "flex", alignItems: "center", gap: "0.3rem", padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            الإعدادات
          </button>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 700 }}>
            سؤال {(idx + 1).toLocaleString("ar")} من {total.toLocaleString("ar")}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="card" style={{ minHeight: 120 }}>
        {q.topic && (
          <div style={{ marginBottom: "1rem" }}>
            <span className="badge badge-dim">{q.topic}</span>
          </div>
        )}
        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--white)", lineHeight: 1.65, margin: 0 }}>
          {q.question}
        </p>
      </div>

      {/* ── Options ── */}
      {(isMCQ || isTF) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {opts.map((opt, i) => {
            let cls = "ans";
            if (revealed) {
              if (i === correct) cls += " correct";
              else if (i === picked) cls += " wrong";
            } else if (i === picked) cls += " chosen";

            const labels = ["أ","ب","ج","د"];
            return (
              <button key={i} className={cls} onClick={() => choose(i)} disabled={revealed}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 800,
                }}>
                  {revealed && i === correct ? "✓" : revealed && i === picked && i !== correct ? "✗" : labels[i] || (i === 0 ? "ص" : "خ")}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Short answer ── */}
      {isSA && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <textarea
            ref={textRef}
            value={shortText}
            onChange={e => setShortText(e.target.value)}
            disabled={revealed}
            placeholder="اكتب إجابتك هنا…"
            rows={3}
            style={{
              width: "100%", background: "var(--ink-800)",
              border: `1px solid ${revealed ? "var(--border)" : "var(--border-hi)"}`,
              borderRadius: "var(--r)", padding: "1rem",
              color: "var(--white)", fontFamily: "Cairo, sans-serif",
              fontSize: "0.95rem", resize: "vertical", outline: "none",
              direction: "rtl", lineHeight: 1.7,
              transition: "border-color 0.2s",
            }}
          />
          {!revealed && (
            <button onClick={submitShort} disabled={!shortText.trim()} className="btn btn-accent" style={{ alignSelf: "flex-start" }}>
              تحقق من إجابتي
            </button>
          )}
        </div>
      )}

      {/* ── Feedback after reveal ── */}
      {revealed && (
        <div className="anim-fade" style={{
          padding: "1.1rem 1.35rem",
          background: isSA ? "var(--ink-800)" : picked === correct ? "rgba(61,191,122,0.07)" : "rgba(224,92,92,0.07)",
          border: `1px solid ${isSA ? "var(--border)" : picked === correct ? "rgba(61,191,122,0.3)" : "rgba(224,92,92,0.25)"}`,
          borderRadius: "var(--r)",
        }}>
          {isSA ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                الإجابة النموذجية
              </div>
              <div style={{ fontSize: "0.92rem", color: "var(--white)", lineHeight: 1.65 }}>
                {q.correctAnswer}
              </div>
            </div>
          ) : (
            <div>
              {picked === correct ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: q.explanation ? "0.65rem" : 0 }}>
                  <span style={{ color: "#3DBF7A", fontSize: "1rem" }}>✓</span>
                  <span style={{ fontWeight: 700, color: "#3DBF7A", fontSize: "0.9rem" }}>إجابة صحيحة</span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: q.explanation ? "0.65rem" : 0 }}>
                  <span style={{ color: "#E05C5C", fontSize: "1rem" }}>✗</span>
                  <span style={{ fontWeight: 700, color: "#E05C5C", fontSize: "0.9rem" }}>
                    الإجابة الصحيحة: {opts[correct]}
                  </span>
                </div>
              )}
              {q.explanation && (
                <p style={{ margin: 0, fontSize: "0.87rem", color: "var(--muted)", lineHeight: 1.65, borderTop: "1px solid var(--border)", paddingTop: "0.65rem" }}>
                  {q.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Next / Finish ── */}
      {revealed && (
        <button onClick={next} disabled={finishing} className="btn btn-accent anim-up"
          style={{ width: "100%", padding: "1rem", fontSize: "1.02rem", borderRadius: "var(--r2)" }}>
          {finishing ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="anim-spin">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                <path d="M12 2A10 10 0 0 1 22 12"/>
              </svg>
              جاري احتساب النتائج…
            </>
          ) : idx < total - 1 ? (
            <>
              السؤال التالي
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </>
          ) : "اعرض نتائجي"}
        </button>
      )}
    </div>
  );
}