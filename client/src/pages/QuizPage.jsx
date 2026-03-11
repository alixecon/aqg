import React, { useState, useEffect, useRef } from "react";

// الخادم يُرجع options كـ object {"أ":"نص","ب":"نص",...}
// هذه الدالة تحوّله لـ array من النصوص
function parseOptions(q, isTF) {
  if (isTF) return ["صحيح", "خطأ"];
  if (!q?.options) return [];
  if (Array.isArray(q.options)) return q.options;
  return Object.values(q.options); // {"أ":"x","ب":"y"} → ["x","y"]
}

// الخادم يُرجع answer كـ "أ"/"ب"/"ج"/"د" — نحوّله لـ index
function parseCorrectIndex(q, isTF) {
  if (!q) return 0;
  if (isTF) {
    const a = q.answer || q.correctAnswer || "";
    return (a === "صحيح" || a === "صح" || a === "صواب" || a === true || a === "أ") ? 0 : 1;
  }
  // إذا كان options object، نجد index من المفاتيح
  if (q.options && !Array.isArray(q.options)) {
    const keys = Object.keys(q.options); // ["أ","ب","ج","د"]
    const answerKey = q.answer || q.correctAnswer || "";
    const idx = keys.indexOf(String(answerKey));
    return idx >= 0 ? idx : 0;
  }
  // إذا كان array أو رقم مباشر
  const c = q.correctAnswer ?? q.answer;
  return typeof c === "number" ? c : 0;
}

export default function QuizPage({ questions, config, onFinish, onBack }) {
  const [idx,       setIdx]       = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [picked,    setPicked]    = useState(null);
  const [revealed,  setRevealed]  = useState(false);
  const [shortText, setShortText] = useState("");
  const [finishing, setFinishing] = useState(false);
  const textRef = useRef(null);

  const isMCQ = config.questionType === "mcq";
  const isTF  = config.questionType === "truefalse";
  const isSA  = config.questionType === "shortanswer";
  const total = questions.length;
  const pct   = (idx / total) * 100;
  const q     = questions[idx];

  const opts    = parseOptions(q, isTF);
  const correct = parseCorrectIndex(q, isTF);

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
          body: JSON.stringify({
            answers: shortQs.map(x => ({
              question: x.q.question,
              correctAnswer: x.q.answer || x.q.correctAnswer || "",
              userAnswer: x.ans,
            }))
          }),
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

  const labels = ["أ", "ب", "ج", "د"];

  return (
    <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Progress ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--t2)", fontSize: "0.82rem", fontFamily: "Almarai, sans-serif",
            display: "flex", alignItems: "center", gap: "0.3rem", padding: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            الإعدادات
          </button>
          <span style={{ fontSize: "0.82rem", color: "var(--t2)", fontWeight: 700, fontFamily: "Almarai, sans-serif" }}>
            {(idx + 1).toLocaleString("ar-SA")} / {total.toLocaleString("ar-SA")}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* ── Question ── */}
      <div className="card">
        {q.topic && (
          <div style={{ marginBottom: "0.85rem" }}>
            <span className="badge badge-dim">{q.topic}</span>
          </div>
        )}
        <p style={{ fontSize: "1.08rem", fontWeight: 700, color: "var(--t1)", lineHeight: 1.7, margin: 0, fontFamily: "Almarai, sans-serif" }}>
          {q.question}
        </p>
      </div>

      {/* ── MCQ / TF Options ── */}
      {(isMCQ || isTF) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {opts.map((opt, i) => {
            let cls = "ans";
            if (revealed) {
              if (i === correct) cls += " correct";
              else if (i === picked) cls += " wrong";
            } else if (i === picked) cls += " chosen";

            return (
              <button key={i} className={cls} onClick={() => choose(i)} disabled={revealed}>
                <span style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,255,255,0.04)", border: "1px solid var(--bd)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.72rem", fontWeight: 800, fontFamily: "Almarai, sans-serif",
                }}>
                  {revealed && i === correct ? "✓"
                    : revealed && i === picked && i !== correct ? "✗"
                    : labels[i] || i + 1}
                </span>
                <span style={{ fontFamily: "Almarai, sans-serif" }}>{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Short Answer ── */}
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
              width: "100%", background: "var(--s3)",
              border: `1px solid ${revealed ? "var(--bd)" : "var(--bh)"}`,
              borderRadius: "var(--r)", padding: "0.9rem 1rem",
              color: "var(--t1)", fontFamily: "Almarai, sans-serif",
              fontSize: "0.95rem", resize: "vertical", outline: "none",
              direction: "rtl", lineHeight: 1.7, transition: "border-color 0.2s",
            }}
          />
          {!revealed && (
            <button onClick={submitShort} disabled={!shortText.trim()} className="btn btn-accent"
              style={{ alignSelf: "flex-start" }}>
              تحقق من إجابتي
            </button>
          )}
        </div>
      )}

      {/* ── Feedback ── */}
      {revealed && (
        <div className="anim-fade" style={{
          padding: "1rem 1.2rem", borderRadius: "var(--r)",
          background: isSA ? "var(--s3)"
            : picked === correct ? "rgba(42,157,111,0.07)" : "rgba(192,80,74,0.07)",
          border: `1px solid ${isSA ? "var(--bd)"
            : picked === correct ? "rgba(42,157,111,0.3)" : "rgba(192,80,74,0.25)"}`,
        }}>
          {isSA ? (
            <div>
              <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "var(--t2)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "Almarai, sans-serif" }}>
                الإجابة النموذجية
              </div>
              <div style={{ fontSize: "0.92rem", color: "var(--t1)", lineHeight: 1.65, fontFamily: "Almarai, sans-serif" }}>
                {q.answer || q.correctAnswer || "—"}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: q.explanation ? "0.65rem" : 0 }}>
                {picked === correct ? (
                  <><span style={{ color: "var(--ok)", fontWeight: 900 }}>✓</span>
                  <span style={{ fontWeight: 700, color: "var(--ok)", fontSize: "0.9rem", fontFamily: "Almarai, sans-serif" }}>إجابة صحيحة</span></>
                ) : (
                  <><span style={{ color: "var(--err)", fontWeight: 900 }}>✗</span>
                  <span style={{ fontWeight: 700, color: "var(--err)", fontSize: "0.9rem", fontFamily: "Almarai, sans-serif" }}>
                    الصحيح: {opts[correct]}
                  </span></>
                )}
              </div>
              {q.explanation && (
                <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--t2)", lineHeight: 1.65, borderTop: "1px solid var(--bd)", paddingTop: "0.6rem", fontFamily: "Almarai, sans-serif" }}>
                  {q.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Next ── */}
      {revealed && (
        <button onClick={next} disabled={finishing} className="btn btn-accent anim-fade"
          style={{ width: "100%", padding: "0.95rem", fontSize: "1rem", borderRadius: "var(--r2)" }}>
          {finishing ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="anim-spin">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2A10 10 0 0 1 22 12"/>
              </svg>
              جاري احتساب النتائج…
            </>
          ) : idx < total - 1 ? (
            <>السؤال التالي
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </>
          ) : "اعرض نتائجي"}
        </button>
      )}
    </div>
  );
}