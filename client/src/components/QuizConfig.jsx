// ConfigPage.jsx — خطوة منفصلة بعد رفع الملف
// الفلسفة: المستخدم قرّر بالفعل (رفع الملف) — هنا نُقلّل الاحتكاك فقط

import React, { useState } from "react";

const TYPES = [
  { v: "mcq",         label: "اختيار متعدد",  desc: "٤ خيارات، إجابة واحدة صحيحة",   icon: "◎" },
  { v: "truefalse",   label: "صح أم خطأ",     desc: "اختبر الفهم العام للمفاهيم",     icon: "⊕" },
  { v: "shortanswer", label: "إجابة قصيرة",   desc: "إجابات مفتوحة، تقييم بالذكاء الاصطناعي", icon: "✏" },
];
const COUNTS = [5, 10, 15, 20];
const DIFFS  = [
  { v: "easy",   label: "سهل",    note: "مفاهيم أساسية",         color: "#3DBF7A" },
  { v: "medium", label: "متوسط", note: "مزيج من الفهم والتطبيق", color: "var(--accent)" },
  { v: "hard",   label: "صعب",   note: "تحليل ونقد عميق",        color: "#E05C5C" },
];

export default function ConfigPage({ session, onQuizReady, onBack }) {
  const [type,   setType]   = useState("mcq");
  const [count,  setCount]  = useState(10);
  const [diff,   setDiff]   = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function generate() {
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId, questionType: type, questionCount: count, difficulty: diff }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التوليد");
      onQuizReady(data.questions, { questionType: type, questionCount: count, difficulty: diff });
    } catch (e) {
      setError(e.message || "حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  const DIFF_COLOR = DIFFS.find(d => d.v === diff)?.color || "var(--accent)";
  const EST_MINS   = Math.ceil(count * 1.5);

  return (
    <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── File badge ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1.2rem", background: "var(--ink-800)", border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(61,191,122,0.1)", border: "1px solid rgba(61,191,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#3DBF7A" }}>✓</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session?.fileName || "الملف المرفوع"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            تم استخراج النص بنجاح · {session?.charCount?.toLocaleString("ar")} حرف
          </div>
        </div>
        <button onClick={onBack} className="btn btn-ghost" style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem", flexShrink: 0 }}>
          تغيير
        </button>
      </div>

      {/* ── نوع الأسئلة ── */}
      <div>
        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.85rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          نوع الأسئلة
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {TYPES.map(t => (
            <button key={t.v} onClick={() => setType(t.v)} style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1rem 1.25rem", borderRadius: "var(--r)",
              border: `1px solid ${type === t.v ? "var(--accent)" : "var(--border)"}`,
              background: type === t.v ? "var(--accent-lo)" : "var(--ink-800)",
              cursor: "pointer", transition: "all 0.15s", textAlign: "right",
            }}>
              <span style={{ fontSize: "1.2rem", opacity: type === t.v ? 1 : 0.4, color: type === t.v ? "var(--accent-hi)" : "var(--muted)", flexShrink: 0 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: type === t.v ? "var(--white)" : "var(--muted)", fontFamily: "Cairo, sans-serif", marginBottom: "0.15rem" }}>{t.label}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--muted)", fontFamily: "Cairo, sans-serif" }}>{t.desc}</div>
              </div>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${type === t.v ? "var(--accent)" : "var(--border)"}`, background: type === t.v ? "var(--accent)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {type === t.v && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── عدد الأسئلة + صعوبة ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.85rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            عدد الأسئلة
          </label>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            {COUNTS.map(n => (
              <button key={n} onClick={() => setCount(n)} className={`pill${count === n ? " on" : ""}`}
                style={{ minWidth: 52, textAlign: "center" }}>
                {n}
              </button>
            ))}
          </div>
          <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--muted)" }}>
            ~{EST_MINS} دقيقة للإكمال
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.85rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            مستوى الصعوبة
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {DIFFS.map(d => (
              <button key={d.v} onClick={() => setDiff(d.v)} style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.55rem 0.9rem", borderRadius: "var(--r)",
                border: `1px solid ${diff === d.v ? d.color : "var(--border)"}`,
                background: diff === d.v ? `${d.color}18` : "var(--ink-800)",
                cursor: "pointer", transition: "all 0.15s",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <span style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: "0.88rem", color: diff === d.v ? "var(--white)" : "var(--muted)" }}>{d.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-err anim-fade">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Generate CTA ── */}
      <button onClick={generate} disabled={loading} className="btn btn-accent anim-glow"
        style={{ width: "100%", fontSize: "1.05rem", padding: "1.05rem", borderRadius: "var(--r2)", marginTop: "0.5rem" }}>
        {loading ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="anim-spin">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
              <path d="M12 2A10 10 0 0 1 22 12"/>
            </svg>
            الذكاء الاصطناعي يبني أسئلتك…
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            ابدأ الاختبار
          </>
        )}
      </button>

      {loading && (
        <p className="anim-fade" style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.8rem", marginTop: "-1rem" }}>
          عادةً أقل من ٣٠ ثانية
        </p>
      )}
    </div>
  );
}