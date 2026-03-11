// ResultsPage.jsx — Fixed: scoring normalization + branded PDF export

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

/**
 * FIX: Normalize correctAnswer to a numeric index.
 *
 * The AI may return correctAnswer as:
 *   - A number (0-based index)  → use as-is
 *   - A string that IS a number ("2") → parse it
 *   - The actual answer text ("باريس") → find its index in options[]
 *
 * Without this, ans.picked (always a number) never equals a text string,
 * so every MCQ/TF answer is marked wrong.
 */
function resolveCorrectIndex(q, isTF) {
  // Build options array the same way QuizPage does
  let opts;
  if (isTF) {
    opts = ["صحيح", "خاطئ"];
  } else if (q.options && !Array.isArray(q.options)) {
    opts = Object.values(q.options); // {"أ":"x","ب":"y"} → ["x","y"]
  } else {
    opts = q.options || [];
  }

  // AI returns "answer" as a key like "أ"/"ب"/"ج"/"د"; fall back to correctAnswer
  const raw = q.answer ?? q.correctAnswer;

  // Already a valid numeric index
  if (typeof raw === "number" && raw >= 0 && raw < opts.length) return raw;

  // Numeric string ("0","1",…)
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    const n = parseInt(raw.trim(), 10);
    if (n >= 0 && n < opts.length) return n;
  }

  // Arabic letter key "أ"/"ب"/"ج"/"د" — map to index via options object keys
  if (typeof raw === "string" && q.options && !Array.isArray(q.options)) {
    const keys = Object.keys(q.options); // ["أ","ب","ج","د"]
    const idx = keys.indexOf(raw.trim());
    if (idx !== -1) return idx;
  }

  // Boolean or Arabic true/false
  if (typeof raw === "boolean") return raw ? 0 : 1;
  if (raw === "صحيح" || raw === "صح" || raw === "أ" || raw === "صواب") return 0;
  if (raw === "خاطئ" || raw === "خطأ" || raw === "ب" || raw === "غلط") return 1;

  // Answer text matches one of the option values
  if (typeof raw === "string" && opts.length) {
    const idx = opts.findIndex(
      (o) => o?.trim().toLowerCase() === raw.trim().toLowerCase()
    );
    if (idx !== -1) return idx;
  }

  console.warn("[ResultsPage] Could not resolve answer:", raw, "opts:", opts);
  return -1;
}

// ─── PDF Export (html2pdf.js — branded HTML → PDF) ───────────────────────────

async function exportPDF(questions, userAnswers, grades, isSA, isTF, score, total, pct) {
  const html2pdf = (await import("html2pdf.js")).default;

  const dateStr   = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  const gradeColor = pct >= 80 ? "#15803d" : pct >= 60 ? "#b45309" : "#b91c1c";
  const gradeBg    = pct >= 80 ? "#f0fdf4" : pct >= 60 ? "#fffbeb" : "#fef2f2";
  const gradeBorder= pct >= 80 ? "#bbf7d0" : pct >= 60 ? "#fde68a" : "#fecaca";

  const questionRows = questions.map((q, i) => {
    const opts      = q.options
      ? (Array.isArray(q.options) ? q.options : Object.values(q.options))
      : (isTF ? ["صحيح", "خاطئ"] : []);
    const correct   = resolveCorrectIndex(q, isTF);
    const ans       = userAnswers[i];
    const isCorrect = isSA
      ? grades[i]?.verdict === "correct"
      : ans?.picked === correct;
    const userText    = isSA ? (ans?.text || "—") : (opts[ans?.picked] ?? "—");
    const correctText = isSA ? (q.answer || q.correctAnswer || "—") : (opts[correct] ?? "—");

    return `
      <div style="border:1px solid #e5e7eb;background:#ffffff;border-radius:8px;margin-bottom:8px;padding:14px;page-break-inside:avoid;border-right:3px solid ${isCorrect ? "#15803d" : "#b91c1c"};">
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;">
          <span style="color:${isCorrect ? "#15803d" : "#b91c1c"};font-weight:900;font-size:13px;flex-shrink:0;margin-top:2px;">${isCorrect ? "✓" : "✗"}</span>
          <span style="color:#111827;font-size:13px;font-weight:600;flex:1;line-height:1.6;">${q.question}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;padding-right:20px;">
          <div style="background:${isCorrect ? "#f0fdf4" : "#fef2f2"};border:1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"};border-radius:6px;padding:6px 10px;font-size:12px;">
            <span style="color:#6b7280;font-weight:700;">إجابتك: </span>
            <span style="color:${isCorrect ? "#15803d" : "#b91c1c"};font-weight:600;">${userText}</span>
          </div>
          ${!isCorrect ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 10px;font-size:12px;">
            <span style="color:#6b7280;font-weight:700;">الإجابة الصحيحة: </span>
            <span style="color:#15803d;font-weight:600;">${correctText}</span>
          </div>` : ""}
          ${grades[i]?.feedback ? `<div style="background:#fffbeb;border-right:2px solid #f59e0b;border-radius:4px;padding:6px 10px;font-size:11px;color:#78350f;">💬 ${grades[i].feedback}</div>` : ""}
          ${q.explanation ? `<div style="background:#f9fafb;border-right:2px solid #d1d5db;border-radius:4px;padding:6px 10px;font-size:11px;color:#6b7280;">💡 ${q.explanation}</div>` : ""}
        </div>
      </div>`;
  }).join("");

  const correctCount = questions.filter((q, i) => {
    const ans = userAnswers[i];
    return isSA ? grades[i]?.verdict === "correct" : ans?.picked === resolveCorrectIndex(q, isTF);
  }).length;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Cairo',sans-serif;background:#ffffff;color:#111827;direction:rtl;padding:32px;font-size:13px;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  </style>
</head>
<body>

  <!-- Header: brand dot + name, date -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid #e5e7eb;margin-bottom:24px;">
    <div style="display:flex;align-items:center;gap:7px;">
      <div style="width:8px;height:8px;border-radius:50%;background:#15803d;"></div>
      <span style="font-size:14px;font-weight:900;color:#111827;">صانع الاختبارات</span>
    </div>
    <span style="color:#9ca3af;font-size:11px;">${dateStr}</span>
  </div>

  <!-- Score summary -->
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px;margin-bottom:24px;display:flex;align-items:center;gap:20px;">
    <div style="text-align:center;flex-shrink:0;">
      <div style="font-size:36px;font-weight:900;color:${gradeColor};line-height:1;">${pct}٪</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${score} / ${total}</div>
    </div>
    <div style="width:1px;height:52px;background:#e5e7eb;flex-shrink:0;"></div>
    <div>
      <div style="display:inline-block;padding:3px 12px;border-radius:100px;font-size:13px;font-weight:800;color:${gradeColor};background:${gradeBg};border:1px solid ${gradeBorder};margin-bottom:6px;">${scoreLabel(pct)}</div>
      <div style="font-size:13px;color:#374151;">${feedbackLine(pct)}</div>
    </div>
    <div style="margin-right:auto;display:flex;gap:12px;text-align:center;">
      <div><div style="font-size:18px;font-weight:900;color:#15803d;">${correctCount}</div><div style="font-size:10px;color:#9ca3af;">صحيح</div></div>
      <div><div style="font-size:18px;font-weight:900;color:#b91c1c;">${total - correctCount}</div><div style="font-size:10px;color:#9ca3af;">خاطئ</div></div>
    </div>
  </div>

  <!-- Section label -->
  <div style="font-size:10px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">مراجعة الأسئلة</div>

  ${questionRows}

  <!-- Footer -->
  <div style="margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;color:#9ca3af;font-size:10px;">
    <span>صانع الاختبارات</span>
    <span>${dateStr}</span>
  </div>

</body></html>`;

  const container = document.createElement("div");
  container.style.cssText = "position:absolute;top:0;left:0;width:794px;max-height:0;overflow:hidden;pointer-events:none;z-index:-9999;";
  container.innerHTML = html;
  document.body.appendChild(container);
  container.style.maxHeight = "none";
  container.style.overflow  = "visible";

  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 300));

  const dateTag = new Date().toISOString().slice(0, 10);
  await html2pdf()
    .set({
      margin: [8, 8, 8, 8],
      filename: `نتيجة-الاختبار-${dateTag}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false, windowWidth: 794, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css"] },
    })
    .from(container)
    .save();

  document.body.removeChild(container);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResultsPage({ questions, userAnswers, grades, config, onRetry }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [exporting, setExporting] = useState(false);

  const isSA = config?.questionType === "shortanswer";
  const isTF = config?.questionType === "truefalse";

  const { score, total, pct } = useMemo(() => {
    let s = 0;
    const t = questions.length;
    questions.forEach((q, i) => {
      const ans = userAnswers[i];
      if (!ans) return;
      if (isSA) {
        const v = grades[i]?.verdict;
        if (v === "correct") s += 1;
        else if (v === "partial") s += 0.5;
      } else {
        // ✅ FIX: normalize correctAnswer to index before comparing
        const correct = resolveCorrectIndex(q, isTF);
        if (correct !== -1 && ans.picked === correct) s += 1;
      }
    });
    return { score: s, total: t, pct: t > 0 ? Math.round((s / t) * 100) : 0 };
  }, [questions, userAnswers, grades, isSA, isTF]);

  const color = scoreColor(pct);

  async function handleExportPDF() {
    setExporting(true);
    try {
      await exportPDF(questions, userAnswers, grades, isSA, isTF, score, total, pct);
    } catch (e) {
      console.error("[PDF Export]", e);
      alert("حدث خطأ أثناء التصدير، حاول مرة أخرى.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Score hero ── */}
      <div style={{
        textAlign: "center", padding: "3rem 2rem",
        background: "var(--ink-800)", border: "1px solid var(--border)",
        borderRadius: "var(--r2)", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`, pointerEvents: "none" }} />

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
              {score}/{total}
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
        <button onClick={handleExportPDF} disabled={exporting} className="btn btn-ghost" style={{ padding: "0.9rem 1.25rem", borderRadius: "var(--r)", opacity: exporting ? 0.6 : 1 }}>
          {exporting ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          )}
          {exporting ? "جارٍ التصدير…" : "تصدير PDF"}
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
            const opts    = q.options || (isTF ? ["صحيح", "خاطئ"] : []);
            // ✅ FIX: use normalized index
            const correct = resolveCorrectIndex(q, isTF);
            const verdict = isSA ? grades[i]?.verdict : ans?.picked === correct ? "correct" : "wrong";
            const isOpen  = openIdx === i;

            const statusColor = verdict === "correct" ? "#3DBF7A" : verdict === "partial" ? "var(--accent)" : "#E05C5C";
            const statusIcon  = verdict === "correct" ? "✓" : verdict === "partial" ? "~" : "✗";
            const statusLabel = verdict === "correct" ? "صحيح" : verdict === "partial" ? "جزئي" : "خاطئ";

            return (
              <div key={i} style={{ border: `1px solid ${isOpen ? statusColor + "50" : "var(--border)"}`, borderRadius: "var(--r)", background: "var(--ink-800)", overflow: "hidden", transition: "border-color 0.2s" }}>
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{ width: "100%", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "right" }}
                >
                  <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: `${statusColor}18`, border: `1px solid ${statusColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 900, color: statusColor }}>
                    {statusIcon}
                  </span>
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
                            let bg = "transparent", clr = "var(--muted)", bdr = "transparent";
                            if (isC)         { bg = "rgba(61,191,122,0.08)"; clr = "#6FDDA8"; bdr = "rgba(61,191,122,0.3)"; }
                            if (isP && !isC) { bg = "rgba(224,92,92,0.07)"; clr = "#F09090"; bdr = "rgba(224,92,92,0.25)"; }
                            return (
                              <div key={oi} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.55rem 0.8rem", borderRadius: 8, background: bg, border: `1px solid ${bdr}` }}>
                                <span style={{ fontSize: "0.8rem", fontWeight: 900, color: clr }}>{isC ? "✓" : isP ? "✗" : "·"}</span>
                                <span style={{ fontSize: "0.88rem", fontFamily: "Cairo, sans-serif", color: clr, fontWeight: isC || isP ? 700 : 400 }}>{o}</span>
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