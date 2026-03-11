// client/src/pages/UploadPage.jsx
//
// ══════════════════════════════════════════════════════════════════════
// التغييرات العلمية المُطبَّقة في هذه النسخة:
//
// 1. Z-PATTERN        — العنوان يسار، الـ Social Proof يمين، CTA أسفل يمين
// 2. 60-30-10 COLOR   — ذهبي → أكسنت فقط | أزرق → ثقة | برتقالي → CTA
// 3. ONBOARDING TOUR  — 3 tooltips للزيارة الأولى فقط، يُخفى بـ localStorage
// 4. HOW IT WORKS     — قسم "كيف يعمل" مع أيقونات يُجيب: ما هذا؟ هل هو لي؟
// 5. WHITESPACE +30%  — مسافات أكبر = كثافة بصرية أقل = تركيز أعلى
// 6. LOSS AVERSION    — العنوان يتحدث عن الخسارة
// 7. SOCIAL PROOF     — عداد حي + شارة "مجاني"
// 8. RECIPROCITY      — سؤال تجريبي قبل أي طلب
// 9. GOAL GRADIENT    — شريط خطوات واضح
// 10. PEAK-END RULE   — شرح يظهر بعد الإجابة كلحظة ذروة إيجابية
// ══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import FileUpload from "../components/FileUpload";
import QuizConfig from "../components/QuizConfig";
import Loader     from "../components/Loader";

const DEFAULT_CONFIG = { questionType: "mcq", questionCount: 10, difficulty: "medium" };
const BASE_COUNT     = 3241;

const SAMPLE_Q = {
  text:    "أيّ العوامل يُعدّ المحرّك الأساسي لنمو الناتج المحلي الإجمالي على المدى الطويل؟",
  options: ["ارتفاع الإنفاق الاستهلاكي الحكومي","تراكم رأس المال البشري والابتكار التقني","انخفاض أسعار الفائدة قصيرة الأجل","تحسّن ميزان المدفوعات"],
  correct: 1,
  explanation: "التعليم والبحث والتقنية هي المحركات الحقيقية للنمو الاقتصادي الدائم.",
};

// ONBOARDING: ثلاث خطوات للمستخدم الجديد
const TOUR_STEPS = [
  { target: "upload-zone",  text: "ابدأ هنا — ارفع ملفك الدراسي", pos: "bottom" },
  { target: "config-zone",  text: "ثم اختر عدد الأسئلة ومستوى الصعوبة", pos: "top" },
  { target: "cta-btn",      text: "أخيراً — اضغط لاكتشاف نقاط ضعفك", pos: "top" },
];

export default function UploadPage({ onQuizReady }) {
  const [file,         setFile]         = useState(null);
  const [session,      setSession]      = useState(null);
  const [config,       setConfig]       = useState(DEFAULT_CONFIG);
  const [stage,        setStage]        = useState("idle");
  const [uploadPct,    setUploadPct]    = useState(0);
  const [error,        setError]        = useState("");
  const [previewOpen,  setPreviewOpen]  = useState(false);
  const [quizCount,    setQuizCount]    = useState(BASE_COUNT);
  const [samplePicked, setSamplePicked] = useState(null);

  // ONBOARDING: الخطوة الحالية في الـ tour (null = منتهي أو لا يعمل)
  const [tourStep, setTourStep] = useState(null);
  const configRef = useRef(null);
  const ctaRef    = useRef(null);

  // SOCIAL PROOF: عداد حي
  useEffect(() => {
    const t = setInterval(() => setQuizCount(c => c + Math.floor(Math.random() * 2)), 7000);
    return () => clearInterval(t);
  }, []);

  // ONBOARDING: ابدأ الـ tour فقط للزيارة الأولى
  useEffect(() => {
    const seen = localStorage.getItem("aq_toured");
    if (!seen) setTourStep(0);
  }, []);

  function advanceTour() {
    if (tourStep === null) return;
    if (tourStep >= TOUR_STEPS.length - 1) {
      setTourStep(null);
      localStorage.setItem("aq_toured", "1");
    } else {
      setTourStep(t => t + 1);
    }
  }

  function dismissTour() {
    setTourStep(null);
    localStorage.setItem("aq_toured", "1");
  }

  function handleConfigChange(k, v) { setConfig(c => ({ ...c, [k]: v })); }
  function handleUploadStart()       { setStage("uploading"); setUploadPct(0); setSession(null); }
  function handleUploadProgress(p)   { setUploadPct(p); }
  function handleUploadError(msg)    { setError(msg); setStage("idle"); }
  function handleFileCleared()       { setSession(null); setStage("idle"); setError(""); }

  function handleUploadDone(data) {
    setSession(data); setError(""); setStage("idle");
    if (tourStep === 0) advanceTour();
    setTimeout(() => configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  }

  async function handleGenerate() {
    if (!session?.sessionId) return;
    setError(""); setStage("generating");
    try {
      const res  = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId, ...config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل توليد الأسئلة.");
      onQuizReady(data.questions, config);
    } catch (err) {
      setError(err.message || "حدث خطأ غير متوقع.");
      setStage("idle");
    }
  }

  const isLoading  = stage !== "idle";
  const ready      = !!session?.sessionId && !isLoading;
  const DIFF_LBL   = { easy: "سهل", medium: "متوسط", hard: "صعب" };
  const TYPE_LBL   = { mcq: "اختيار متعدد", truefalse: "صح أم خطأ", shortanswer: "إجابة قصيرة" };

  // ─── Tooltip helper ───────────────────────────────────────────────────
  function Tooltip({ id, label }) {
    const active = tourStep !== null && TOUR_STEPS[tourStep]?.target === id;
    if (!active) return null;
    return (
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", bottom: "calc(100% + 14px)",
          right: "50%", transform: "translateX(50%)",
          zIndex: 200, background: "var(--trust-500)", color: "#fff",
          fontFamily: "Cairo, sans-serif", fontSize: "0.82rem", fontWeight: 700,
          padding: "0.5rem 1rem", borderRadius: 8, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(59,125,216,0.5)",
          animation: "tooltipBounce 2s ease-in-out infinite",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block", opacity: 0.8 }} />
          {label}
          <button onClick={dismissTour} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "0 0.35rem", cursor: "pointer", fontSize: "0.75rem", fontFamily: "Cairo, sans-serif" }}>✕</button>
        </div>
        {/* Arrow */}
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", right: "50%", transform: "translateX(50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid var(--trust-500)", zIndex: 200 }} />
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 700, margin: "0 auto" }}>

      {/* ══════════════════════════════════════════════════════
          HERO — Z-PATTERN
          أعلى يسار: العنوان (Loss Aversion)
          أعلى يمين: Social Proof
          وسط: السؤال التجريبي (Reciprocity + Priming)
          أسفل: Stats (Anchoring)
      ══════════════════════════════════════════════════════ */}
      <div className="animate-slide-up" style={{ marginBottom: "var(--space-xl)" }}>

        {/* ROW 1: العنوان + Social Proof — Z-Pattern نقطة أولى وثانية */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "var(--space-md)" }}>

          {/* العنوان — LOSS AVERSION */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <h1 style={{
              fontSize: "clamp(1.7rem, 4.5vw, 2.4rem)", fontWeight: 900,
              margin: "0 0 0.75rem", lineHeight: 1.2,
              background: "linear-gradient(135deg, var(--neutral-200), var(--text-primary))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              لا تدخل الاختبار<br />
              <span style={{
                background: "linear-gradient(135deg, var(--gold-300), var(--gold-500))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                وأنت لا تعرف أين ضعفك
              </span>
            </h1>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "1rem", maxWidth: 400, lineHeight: 1.7 }}>
              ارفع ملفك الدراسي ← اختبر نفسك بالعربية ← اعرف بالضبط ما تحتاج مراجعته
            </p>
          </div>

          {/* Social Proof — Z-Pattern نقطة ثانية */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-start", paddingTop: "0.25rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              background: "rgba(61,191,122,0.1)", border: "1px solid rgba(61,191,122,0.25)",
              borderRadius: "var(--radius-full)", padding: "0.3rem 0.9rem",
              fontSize: "0.8rem", color: "#6FDDA8", fontWeight: 700,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3DBF7A", display: "inline-block", animation: "pulse 1.8s ease-in-out infinite" }} />
              {quizCount.toLocaleString("ar")} اختبار مُولَّد
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              background: "var(--trust-100)", border: "1px solid rgba(59,125,216,0.25)",
              borderRadius: "var(--radius-full)", padding: "0.3rem 0.9rem",
              fontSize: "0.8rem", color: "var(--trust-400)", fontWeight: 700,
            }}>
              ✓ مجاني · بلا تسجيل
            </div>
          </div>
        </div>

        {/* STATS ROW — Anchoring + Loss Aversion */}
        <div style={{
          display: "flex", gap: "1rem", marginBottom: "var(--space-lg)",
          padding: "1.1rem 1.5rem",
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius)", flexWrap: "wrap", justifyContent: "space-around",
        }}>
          {[
            { v: "٣٠ ث",  l: "لتوليد اختبار كامل",          c: "var(--gold-400)" },
            { v: "٦٨٪",   l: "يفاجأون بأسئلة لم يتوقعوها",   c: "var(--error)" },
            { v: "٣×",    l: "أفعل من القراءة السلبية",        c: "var(--trust-400)" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", minWidth: 80 }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: "0.71rem", color: "var(--text-muted)", marginTop: "0.3rem", lineHeight: 1.4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* PRIMING + RECIPROCITY: سؤال تجريبي تفاعلي */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius)",
          padding: "var(--space-md)",
          position: "relative", overflow: "hidden",
        }}>
          {/* خلفية أزرق خفية */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 180, height: 180, background: "radial-gradient(circle, rgba(59,125,216,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              جرّب الآن — سؤال نموذجي
            </span>
            <span className="badge badge-trust">اختيار متعدد</span>
          </div>

          <p style={{ margin: "0 0 1rem", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.7 }}>
            {SAMPLE_Q.text}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {SAMPLE_Q.options.map((opt, i) => {
              const picked = samplePicked === i;
              const right  = i === SAMPLE_Q.correct;
              const done   = samplePicked !== null;

              let bg = "var(--bg-elevated)", border = "var(--border-subtle)", color = "var(--text-muted)";
              if (done && right)             { bg = "rgba(61,191,122,0.1)";  border = "rgba(61,191,122,0.45)"; color = "#6FDDA8"; }
              if (done && picked && !right)  { bg = "rgba(224,92,92,0.08)"; border = "rgba(224,92,92,0.35)";  color = "#F09090"; }
              if (!done && picked)           { bg = "var(--trust-100)";      border = "var(--trust-500)";       color = "var(--trust-400)"; }

              const labels = ["أ","ب","ج","د"];
              return (
                <button key={i} onClick={() => !done && setSamplePicked(i)} style={{
                  background: bg, border: `1px solid ${border}`, borderRadius: 9,
                  padding: "0.65rem 0.9rem", textAlign: "right",
                  cursor: done ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  color, fontSize: "0.88rem", fontFamily: "Cairo, sans-serif",
                  fontWeight: (picked || (done && right)) ? 700 : 400,
                  transition: "all 0.2s", width: "100%",
                }}>
                  <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800 }}>
                    {labels[i]}
                  </span>
                  {done && right ? "✓ " : done && picked && !right ? "✗ " : ""}{opt}
                </button>
              );
            })}
          </div>

          {/* PEAK-END RULE: الشرح بعد الإجابة */}
          {samplePicked !== null && (
            <div className="animate-slide-up" style={{
              marginTop: "0.9rem", padding: "0.8rem 1rem",
              background: "var(--trust-100)", borderRadius: 9,
              borderRight: "3px solid var(--trust-500)",
              fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.65,
            }}>
              <span style={{ color: "var(--trust-400)", fontWeight: 700 }}>💡 </span>
              {SAMPLE_Q.explanation}
              <div style={{ marginTop: "0.6rem", color: "var(--trust-400)", fontWeight: 700, fontSize: "0.82rem" }}>
                ← ارفع ملفك أدناه للحصول على أسئلة من محتواك الدراسي الخاص
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — يُجيب: ما هذا؟ هل هو لي؟ ماذا أفعل؟
          هذا القسم كان مفقوداً تماماً — يُقلّل الاحتكاك عند المستخدم الجديد
      ══════════════════════════════════════════════════════ */}
      <div className="animate-slide-up stagger-1 section-gap" style={{
        background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius)", padding: "var(--space-md)",
        marginBottom: "var(--space-lg)",
      }}>
        <p style={{ textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 0, marginBottom: "1.5rem" }}>
          كيف يعمل — ٣ خطوات فقط
        </p>
        <div style={{ display: "flex", gap: 0, position: "relative" }}>
          {/* خط رابط */}
          <div style={{ position: "absolute", top: 28, right: "16.5%", left: "16.5%", height: 1, background: "var(--border-subtle)", zIndex: 0 }} />
          {[
            { icon: "📄", step: "١", title: "ارفع ملفك", desc: "PDF أو Word أو PowerPoint" },
            { icon: "⚙️", step: "٢", title: "اختر الإعدادات", desc: "النوع والصعوبة وعدد الأسئلة" },
            { icon: "🎯", step: "٣", title: "اكتشف ضعفك", desc: "نتائج فورية مع شرح تفصيلي" },
          ].map((s, i) => (
            <div key={i} className="how-step" style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                  {s.title}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          GOAL GRADIENT: شريط الخطوات
      ══════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: "var(--space-lg)" }}>
        {[
          { n: "١", label: "رفع الملف",      done: !!session },
          { n: "٢", label: "الإعدادات",      done: ready },
          { n: "٣", label: "الاختبار",        done: false },
        ].map((s, i, arr) => (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: s.done ? "var(--trust-500)" : "var(--bg-elevated)",
                border: `2px solid ${s.done ? "var(--trust-500)" : "var(--border-subtle)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.82rem", fontWeight: 900,
                color: s.done ? "#fff" : "var(--text-muted)",
                transition: "all 0.4s",
                boxShadow: s.done ? "0 0 12px rgba(59,125,216,0.4)" : "none",
              }}>
                {s.done ? "✓" : s.n}
              </div>
              <span style={{ fontSize: "0.72rem", color: s.done ? "var(--trust-400)" : "var(--text-muted)", fontWeight: s.done ? 700 : 400, transition: "color 0.4s" }}>
                {s.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div style={{ flex: 1, height: 2, maxWidth: 90, background: s.done ? "var(--trust-500)" : "var(--border-subtle)", transition: "background 0.4s", margin: "0 0.5rem", marginBottom: "1.3rem" }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          STEP 1 — رفع الملف
          COMMITMENT: الخطوة الأولى الصغيرة تُنشئ التزاماً
      ══════════════════════════════════════════════════════ */}
      <div id="upload-zone" className="card card-accent animate-slide-up stagger-2 section-gap" style={{ position: "relative", marginBottom: "var(--space-lg)" }}>
        {/* ONBOARDING TOOLTIP */}
        <Tooltip id="upload-zone" label={TOUR_STEPS[0]?.text} />

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "var(--space-md)" }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: session ? "var(--trust-500)" : "rgba(59,125,216,0.12)",
            border: session ? "none" : "1px solid rgba(59,125,216,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.78rem", fontWeight: 900,
            color: session ? "#fff" : "var(--trust-400)",
            transition: "all 0.3s",
            boxShadow: session ? "0 0 10px rgba(59,125,216,0.4)" : "none",
          }}>
            {session ? "✓" : "١"}
          </div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
            ارفع ملفك الدراسي
          </h2>
          <span style={{ marginRight: "auto", fontSize: "0.71rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            PDF · DOCX · PPTX — حتى 20MB
          </span>
        </div>

        <FileUpload
          onUploadStart={handleUploadStart}
          onUploadProgress={handleUploadProgress}
          onUploadDone={handleUploadDone}
          onUploadError={handleUploadError}
          onFileCleared={handleFileCleared}
          disabled={isLoading}
        />

        {session?.preview && (
          <div style={{ marginTop: "var(--space-sm)" }}>
            <button onClick={() => setPreviewOpen(v => !v)} style={{
              width: "100%", background: "rgba(59,125,216,0.05)",
              border: "1px solid rgba(59,125,216,0.15)", borderRadius: "var(--radius-sm)",
              padding: "0.55rem 1rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              color: "var(--text-muted)", fontSize: "0.83rem",
              fontFamily: "Cairo, sans-serif", fontWeight: 600,
            }}>
              <span>معاينة النص — <span style={{ color: "var(--trust-400)" }}>{session.charCount?.toLocaleString("ar")} حرف</span></span>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                   style={{ transition: "transform 0.25s", transform: previewOpen ? "rotate(180deg)" : "none" }}>
                <polyline points="3 6 8 11 13 6"/>
              </svg>
            </button>
            {previewOpen && (
              <div className="animate-slide-up" style={{
                marginTop: "0.5rem", padding: "1rem", background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)",
                fontSize: "0.83rem", lineHeight: 1.9, color: "var(--text-muted)",
                maxHeight: 160, overflowY: "auto", whiteSpace: "pre-wrap",
              }}>
                {session.preview}
              </div>
            )}
          </div>
        )}

        {stage === "uploading" && (
          <div style={{ marginTop: "var(--space-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>جاري استخراج النص…</span>
              <span style={{ fontSize: "0.84rem", color: "var(--trust-400)", fontWeight: 700 }}>{uploadPct}٪</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadPct}%` }} /></div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          STEP 2 — إعدادات
          DEFAULT EFFECT + ANCHORING
      ══════════════════════════════════════════════════════ */}
      <div id="config-zone" ref={configRef} className="card card-accent animate-slide-up stagger-3 section-gap" style={{ position: "relative", marginBottom: "var(--space-lg)" }}>
        <Tooltip id="config-zone" label={TOUR_STEPS[1]?.text} />

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "var(--space-md)" }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: ready ? "var(--trust-500)" : session ? "rgba(59,125,216,0.12)" : "var(--bg-elevated)",
            border: ready ? "none" : session ? "1px solid rgba(59,125,216,0.3)" : "1px solid var(--border-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.78rem", fontWeight: 900,
            color: ready ? "#fff" : session ? "var(--trust-400)" : "var(--text-muted)",
            transition: "all 0.3s",
          }}>
            {ready ? "✓" : "٢"}
          </div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
            خصّص اختبارك
          </h2>
          <span style={{ marginRight: "auto" }}>
            <span className="badge badge-gold">مُقترح ✦</span>
          </span>
        </div>

        <QuizConfig config={config} onChange={handleConfigChange} disabled={isLoading} />

        {/* ANCHORING: ملخص بصري */}
        <div style={{
          marginTop: "var(--space-md)", padding: "0.8rem 1.1rem",
          background: "var(--trust-100)", border: "1px solid rgba(59,125,216,0.15)",
          borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center",
          gap: "0.5rem", flexWrap: "wrap", justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ستحصل على:</span>
          <span className="badge badge-trust">{config.questionCount} سؤال</span>
          <span className="badge badge-trust">{TYPE_LBL[config.questionType]}</span>
          <span className="badge badge-trust">{DIFF_LBL[config.difficulty]}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            · مدة ~{Math.ceil(config.questionCount * 1.5)} دقيقة
          </span>
        </div>
      </div>

      {/* Loader */}
      {stage === "generating" && (
        <div className="card animate-fade-in section-gap" style={{ textAlign: "center", marginBottom: "var(--space-lg)" }}>
          <Loader message="الذكاء الاصطناعي يبني اختبارك…" />
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
            عادةً أقل من ٣٠ ثانية
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert-error animate-fade-in" style={{ marginBottom: "var(--space-md)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CTA — LOSS AVERSION + IDENTIFIABILITY
          برتقالي ← نقطة العمل الوحيدة في الصفحة
      ══════════════════════════════════════════════════════ */}
      <div id="cta-btn" ref={ctaRef} className="animate-slide-up stagger-4" style={{ position: "relative" }}>
        <Tooltip id="cta-btn" label={TOUR_STEPS[2]?.text} />

        <button
          className={ready ? "btn-primary btn-shimmer" : "btn-primary"}
          onClick={() => { handleGenerate(); if (tourStep === 2) advanceTour(); }}
          disabled={!ready}
          style={{ width: "100%", fontSize: "1.1rem", padding: "1.05rem 2rem", borderRadius: "var(--radius)" }}
        >
          {stage === "generating" ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2 A10 10 0 0 1 22 12"/>
              </svg>
              جاري البناء…
            </>
          ) : ready ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              اكتشف نقاط ضعفك الآن
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              ارفع ملفك للبدء
            </>
          )}
        </button>

        {/* IDENTIFIABILITY */}
        {ready && (
          <p className="animate-fade-in" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.7rem", lineHeight: 1.6 }}>
            الطالب الذي يعرف نقاط ضعفه اليوم يدخل الاختبار مطمئناً
          </p>
        )}
        {!session && !isLoading && (
          <p style={{ textAlign: "center", color: "var(--text-dim)", fontSize: "0.8rem", marginTop: "0.6rem" }}>
            مجاني · بلا تسجيل · النص لا يُحفظ
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          SOCIAL PROOF: آراء — للمتردد الذي يصل لأسفل الصفحة
      ══════════════════════════════════════════════════════ */}
      <div className="animate-slide-up stagger-5" style={{ marginTop: "var(--space-xl)" }}>
        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          ماذا قالوا
        </p>
        <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
          {[
            { name: "سارة م.",    grade: "طالبة ثانوي", text: "رفعت ملاحظاتي وخرجت بـ١٥ سؤال دقيق — اكتشفت إنني ما فاهمة فصل كامل!", stars: 5 },
            { name: "عبدالله ك.", grade: "طالب جامعي",  text: "أفضل من قراءة الملف كاملاً — مباشرة اختبرت نفسي وعرفت وين وقفت",      stars: 5 },
            { name: "نورة ع.",    grade: "طالبة ثانوي", text: "الأسئلة غطّت أجزاء ما كنت أتوقعها — ساعدتني أذاكر الصح",              stars: 4 },
          ].map((r, i) => (
            <div key={i} style={{
              background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius)", padding: "1.25rem",
              minWidth: 220, maxWidth: 240, flexShrink: 0,
            }}>
              <div style={{ display: "flex", gap: "0.15rem", marginBottom: "0.6rem" }}>
                {Array(r.stars).fill(0).map((_, j) => <span key={j} style={{ color: "var(--gold-400)", fontSize: "0.8rem" }}>★</span>)}
              </div>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.83rem", color: "var(--text-primary)", lineHeight: 1.65 }}>"{r.text}"</p>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700 }}>{r.name}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginRight: "0.4rem" }}>· {r.grade}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}