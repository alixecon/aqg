// ResultsPage.jsx — Fixed: scoring normalization + branded PDF export

import React, { useState, useMemo } from "react";
import html2pdf from "html2pdf.js";

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
  if (raw === "صحيح" || raw === "أ") return 0;
  if (raw === "خاطئ" || raw === "ب") return 1;

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

// ─── PDF Export ───────────────────────────────────────────────────────────────

async function exportPDF(questions, userAnswers, grades, isSA, isTF, score, total, pct) {
  const dateStr = new Date().toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });

  const gradeColor = pct >= 80 ? "#3DBF7A" : pct >= 60 ? "#F59E0B" : "#E05C5C";
  const gradeBg    = pct >= 80 ? "#0d2e1e" : pct >= 60 ? "#2d1f06" : "#2e0d0d";

  const questionRows = questions.map((q, i) => {
    const ans  = userAnswers[i];
    const opts = q.options || (isTF ? ["صحيح", "خاطئ"] : []);
    const correct = resolveCorrectIndex(q, isTF);
    const verdict = isSA
      ? (grades[i]?.verdict || "wrong")
      : ans?.picked === correct ? "correct" : "wrong";

    const isCorrect  = verdict === "correct";
    const isPartial  = verdict === "partial";
    const rowColor   = isCorrect ? "#3DBF7A" : isPartial ? "#F59E0B" : "#E05C5C";
    const rowBg      = isCorrect ? "#0a1f14" : isPartial ? "#1f1508" : "#1f0a0a";
    const statusIcon = isCorrect ? "✓" : isPartial ? "~" : "✗";
    const statusText = isCorrect ? "صحيح" : isPartial ? "جزئي" : "خاطئ";

    const userText = isSA
      ? (ans?.text || "—")
      : (opts[ans?.picked] || "—");

    const correctText = isSA
      ? q.correctAnswer
      : (opts[correct] || "—");

    return `
      <div class="q-card" style="border-color:${rowColor}22; background:${rowBg};">
        <div class="q-header">
          <span class="q-badge" style="color:${rowColor}; border-color:${rowColor}44; background:${rowColor}11;">
            ${statusIcon}
          </span>
          <span class="q-num" style="color:${rowColor}">س${i + 1}</span>
          <span class="q-text">${q.question}</span>
          <span class="q-verdict" style="color:${rowColor}">${statusText}</span>
        </div>

        <div class="answers">
          <div class="answer-row" style="background:${rowBg}; border-color:${rowColor}22;">
            <span class="answer-label">إجابتك:</span>
            <span class="answer-val" style="color:${isCorrect ? '#3DBF7A' : '#E05C5C'}">${userText}</span>
          </div>
          ${!isCorrect ? `
          <div class="answer-row" style="background:#0a1f14; border-color:#3DBF7A33;">
            <span class="answer-label">الإجابة الصحيحة:</span>
            <span class="answer-val" style="color:#3DBF7A">${correctText}</span>
          </div>` : ""}
          ${grades[i]?.feedback ? `
          <div class="feedback-row">
            <span class="feedback-icon">💬</span>
            <span>${grades[i].feedback}</span>
          </div>` : ""}
          ${q.explanation ? `
          <div class="explanation-row">
            <span class="explain-icon">💡</span>
            <span>${q.explanation}</span>
          </div>` : ""}
        </div>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <title>نتيجة الاختبار</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Cairo', sans-serif;
      background: #0E1117;
      color: #E8EAF0;
      direction: rtl;
      padding: 2.5rem;
      font-size: 13px;
      line-height: 1.7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #2a2f3e;
      margin-bottom: 2rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .brand-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #3DBF7A;
      box-shadow: 0 0 8px #3DBF7A88;
    }
    .brand-name {
      font-size: 1.1rem;
      font-weight: 900;
      color: #E8EAF0;
      letter-spacing: -0.01em;
    }
    .date { color: #6B7280; font-size: 0.82rem; }

    /* ── Score hero ── */
    .score-hero {
      background: #161B27;
      border: 1px solid #2a2f3e;
      border-radius: 16px;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }
    .score-hero::before {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      width: 250px; height: 250px;
      border-radius: 50%;
      background: radial-gradient(circle, ${gradeColor}18 0%, transparent 70%);
      pointer-events: none;
    }
    .score-ring { position: relative; flex-shrink: 0; }
    .score-ring svg { display: block; }
    .score-info-main {
      font-size: 2rem;
      font-weight: 900;
      color: ${gradeColor};
      line-height: 1;
    }
    .score-info-label {
      font-size: 0.85rem;
      color: #9CA3AF;
      margin-top: 0.25rem;
    }
    .score-details { flex: 1; }
    .score-grade {
      display: inline-block;
      padding: 0.4rem 1.1rem;
      border-radius: 100px;
      font-size: 1.2rem;
      font-weight: 900;
      color: ${gradeColor};
      background: ${gradeBg};
      border: 1px solid ${gradeColor}44;
      margin-bottom: 0.6rem;
    }
    .score-fraction {
      font-size: 1.4rem;
      font-weight: 800;
      color: #E8EAF0;
      margin-bottom: 0.4rem;
    }
    .score-fraction span { color: ${gradeColor}; }
    .score-feedback { color: #9CA3AF; font-size: 0.88rem; }

    /* ── Stats bar ── */
    .stats-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .stat {
      flex: 1;
      background: #161B27;
      border: 1px solid #2a2f3e;
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
    }
    .stat-num { font-size: 1.5rem; font-weight: 900; }
    .stat-lbl { font-size: 0.72rem; color: #6B7280; margin-top: 0.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }

    /* ── Section title ── */
    .section-title {
      font-size: 0.72rem;
      font-weight: 800;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }

    /* ── Question cards ── */
    .q-card {
      border: 1px solid;
      border-radius: 12px;
      margin-bottom: 0.85rem;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .q-header {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      padding: 0.85rem 1rem;
    }
    .q-badge {
      width: 22px; height: 22px; flex-shrink: 0;
      border-radius: 50%;
      border: 1px solid;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 900;
      margin-top: 1px;
    }
    .q-num { font-size: 0.75rem; font-weight: 800; flex-shrink: 0; margin-top: 3px; }
    .q-text { flex: 1; font-size: 0.88rem; font-weight: 600; color: #E8EAF0; }
    .q-verdict { font-size: 0.72rem; font-weight: 800; flex-shrink: 0; margin-top: 3px; }

    .answers {
      padding: 0 1rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .answer-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      padding: 0.45rem 0.7rem;
      border-radius: 8px;
      border: 1px solid;
      font-size: 0.83rem;
    }
    .answer-label { font-weight: 700; color: #9CA3AF; flex-shrink: 0; }
    .answer-val   { font-weight: 600; }
    .feedback-row {
      display: flex;
      gap: 0.5rem;
      padding: 0.55rem 0.7rem;
      background: #1E2235;
      border-right: 3px solid #F59E0B;
      border-radius: 6px;
      font-size: 0.82rem;
      color: #C9CED8;
      line-height: 1.6;
    }
    .feedback-icon { flex-shrink: 0; }
    .explanation-row {
      display: flex;
      gap: 0.5rem;
      padding: 0.55rem 0.7rem;
      background: #1A2030;
      border-right: 3px solid #2a3a5e;
      border-radius: 6px;
      font-size: 0.82rem;
      color: #9CA3AF;
      line-height: 1.6;
    }
    .explain-icon { flex-shrink: 0; }

    /* ── Footer ── */
    .footer {
      margin-top: 3rem;
      padding-top: 1.2rem;
      border-top: 1px solid #2a2f3e;
      display: flex;
      justify-content: space-between;
      color: #4B5563;
      font-size: 0.72rem;
    }

    @media print {
      body { background: #0E1117 !important; }
      .q-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <div class="brand-dot"></div>
      <span class="brand-name">صانع الاختبارات</span>
    </div>
    <span class="date">${dateStr}</span>
  </div>

  <div class="score-hero">
    <div class="score-ring">
      <svg width="110" height="110" viewBox="0 0 110 110" style="transform:rotate(-90deg)">
        <circle cx="55" cy="55" r="46" fill="none" stroke="#1E2235" stroke-width="8"/>
        <circle cx="55" cy="55" r="46" fill="none" stroke="${gradeColor}" stroke-width="8"
          stroke-linecap="round"
          stroke-dasharray="${2 * Math.PI * 46}"
          stroke-dashoffset="${2 * Math.PI * 46 * (1 - pct / 100)}"/>
      </svg>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <span style="font-size:1.6rem;font-weight:900;color:${gradeColor};line-height:1">${pct}٪</span>
        <span style="font-size:0.7rem;color:#6B7280;margin-top:2px">${score}/${total}</span>
      </div>
    </div>

    <div class="score-details">
      <div class="score-grade">${scoreLabel(pct)}</div>
      <div class="score-fraction">
        أجبت على <span>${score}</span> من <span>${total}</span> سؤالاً
      </div>
      <p class="score-feedback">${feedbackLine(pct)}</p>
    </div>
  </div>

  <div class="stats-bar">
    <div class="stat">
      <div class="stat-num" style="color:#3DBF7A">${questions.filter((q,i) => {
        const ans = userAnswers[i];
        if (!ans) return false;
        if (isSA) return grades[i]?.verdict === "correct";
        return ans.picked === resolveCorrectIndex(q, isTF);
      }).length}</div>
      <div class="stat-lbl">إجابات صحيحة</div>
    </div>
    <div class="stat">
      <div class="stat-num" style="color:#E05C5C">${questions.filter((q,i) => {
        const ans = userAnswers[i];
        if (!ans) return false;
        if (isSA) return grades[i]?.verdict === "wrong";
        return ans.picked !== resolveCorrectIndex(q, isTF);
      }).length}</div>
      <div class="stat-lbl">إجابات خاطئة</div>
    </div>
    <div class="stat">
      <div class="stat-num" style="color:#6B7280">${questions.filter((_,i) => !userAnswers[i]).length}</div>
      <div class="stat-lbl">بدون إجابة</div>
    </div>
    <div class="stat">
      <div class="stat-num" style="color:#E8EAF0">${total}</div>
      <div class="stat-lbl">إجمالي الأسئلة</div>
    </div>
  </div>

  <div class="section-title">مراجعة الأسئلة</div>
  ${questionRows}

  <div class="footer">
    <span>صانع الاختبارات — تصدير تلقائي بالذكاء الاصطناعي</span>
    <span>${dateStr}</span>
  </div>

</body>
</html>`;

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:794px;";
  container.innerHTML = html;
  document.body.appendChild(container);

  const dateTag = new Date().toISOString().slice(0, 10);
  await html2pdf()
    .set({
      margin: 0,
      filename: `نتيجة-الاختبار-${dateTag}.pdf`,
      image: { type: "jpeg", quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#0E1117" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
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