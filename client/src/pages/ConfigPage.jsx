import React, { useState } from "react";

const TYPES = [
  { v: "mcq",         icon: "◎", label: "اختيار متعدد",  desc: "٤ خيارات — إجابة واحدة صحيحة" },
  { v: "truefalse",   icon: "⊕", label: "صح أم خطأ",     desc: "اختبر الفهم العام للمفاهيم" },
  { v: "shortanswer", icon: "✏", label: "إجابة قصيرة",   desc: "إجابات مفتوحة بتقييم الذكاء الاصطناعي" },
];

const COUNTS = [5, 10, 15, 20];

const DIFFS = [
  { v: "easy",   label: "سهل",    note: "مفاهيم أساسية",           color: "#2A9D6F" },
  { v: "medium", label: "متوسط",  note: "فهم وتطبيق",              color: "#C07A2A" },
  { v: "hard",   label: "صعب",    note: "تحليل عميق",              color: "#C0504A" },
];

export default function ConfigPage({ session, onQuizReady, onBack }) {
  const [type,    setType]    = useState("mcq");
  const [count,   setCount]   = useState(10);
  const [diff,    setDiff]    = useState("medium");
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
      console.log("[DEBUG] API response:", JSON.stringify(data).slice(0, 300));
      if (!res.ok) throw new Error(data.error || "فشل التوليد");
      const questions = Array.isArray(data.questions) ? data.questions : [];
      if (questions.length === 0) throw new Error("لم يتم توليد أي أسئلة، حاول مرة أخرى.");
      onQuizReady(questions, { questionType: type, questionCount: count, difficulty: diff });
    } catch (e) {
      setError(e.message || "حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  const estMins = Math.ceil(count * 1.5);

  return (
    <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── شارة الملف ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.85rem",
        padding: "0.9rem 1.1rem",
        background: "var(--s2)", border: "1px solid var(--bd)",
        borderRadius: "var(--r)",
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: "rgba(42,157,111,0.1)", border: "1px solid rgba(42,157,111,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#2A9D6F", fontWeight: 900, fontSize: "0.9rem",
        }}>✓</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: "0.88rem", color: "var(--t1)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {session?.fileName || "الملف المرفوع"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--t2)", marginTop: "0.1rem" }}>
            تم استخراج النص · {session?.charCount?.toLocaleString("ar-SA")} حرف
          </div>
        </div>
        <button onClick={onBack} className="btn btn-ghost"
          style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem", flexShrink: 0 }}>
          تغيير
        </button>
      </div>

      {/* ── نوع الأسئلة ── */}
      <div>
        <label style={{
          display: "block", fontSize: "0.75rem", fontWeight: 700,
          color: "var(--t2)", marginBottom: "0.75rem",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          نوع الأسئلة
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {TYPES.map(t => {
            const active = type === t.v;
            return (
              <button key={t.v} onClick={() => setType(t.v)} style={{
                display: "flex", alignItems: "center", gap: "0.9rem",
                padding: "0.9rem 1.1rem", borderRadius: "var(--r)",
                border: `1px solid ${active ? "var(--a)" : "var(--bd)"}`,
                background: active ? "var(--al)" : "var(--s3)",
                cursor: "pointer", transition: "all 0.14s", textAlign: "right",
                width: "100%",
              }}>
                {/* Radio dot */}
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${active ? "var(--a)" : "var(--bd)"}`,
                  background: active ? "var(--a)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.14s",
                }}>
                  {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                </div>
                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "Almarai, sans-serif", fontWeight: 700,
                    fontSize: "0.9rem",
                    color: active ? "var(--t1)" : "var(--t2)",
                    marginBottom: "0.15rem",
                    transition: "color 0.14s",
                  }}>
                    {t.label}
                  </div>
                  <div style={{ fontFamily: "Almarai, sans-serif", fontSize: "0.75rem", color: "var(--t3)" }}>
                    {t.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── عدد الأسئلة ── */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <label style={{
            fontSize: "0.75rem", fontWeight: 700, color: "var(--t2)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            عدد الأسئلة
          </label>
          <span style={{ fontSize: "0.75rem", color: "var(--t3)" }}>
            ~{estMins} دقيقة
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {COUNTS.map(n => (
            <button key={n} onClick={() => setCount(n)}
              className={`pill${count === n ? " on" : ""}`}
              style={{ flex: 1, textAlign: "center", padding: "0.55rem 0" }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ── مستوى الصعوبة ── */}
      <div>
        <label style={{
          display: "block", fontSize: "0.75rem", fontWeight: 700,
          color: "var(--t2)", marginBottom: "0.75rem",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          مستوى الصعوبة
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {DIFFS.map(d => {
            const active = diff === d.v;
            return (
              <button key={d.v} onClick={() => setDiff(d.v)} style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", gap: "0.4rem",
                padding: "0.75rem 0.5rem", borderRadius: "var(--r)",
                border: `1px solid ${active ? d.color + "80" : "var(--bd)"}`,
                background: active ? d.color + "14" : "var(--s3)",
                cursor: "pointer", transition: "all 0.14s",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: active ? d.color : "var(--t3)",
                  transition: "background 0.14s",
                }} />
                <span style={{
                  fontFamily: "Almarai, sans-serif",
                  fontWeight: 700, fontSize: "0.88rem",
                  color: active ? "var(--t1)" : "var(--t2)",
                  transition: "color 0.14s",
                }}>
                  {d.label}
                </span>
                <span style={{ fontFamily: "Almarai, sans-serif", fontSize: "0.68rem", color: "var(--t3)", textAlign: "center", lineHeight: 1.4 }}>
                  {d.note}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ملخص ── */}
      <div style={{
        padding: "0.8rem 1.1rem",
        background: "var(--s3)", border: "1px solid var(--bd)",
        borderRadius: "var(--r)",
        display: "flex", alignItems: "center",
        gap: "0.5rem", flexWrap: "wrap",
        fontSize: "0.78rem", color: "var(--t2)",
      }}>
        <span>ستحصل على</span>
        <span style={{ color: "var(--ah)", fontWeight: 700 }}>{count} سؤال</span>
        <span>·</span>
        <span style={{ color: "var(--ah)", fontWeight: 700 }}>
          {TYPES.find(t => t.v === type)?.label}
        </span>
        <span>·</span>
        <span style={{ color: "var(--ah)", fontWeight: 700 }}>
          {DIFFS.find(d => d.v === diff)?.label}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-err anim-fade">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── CTA ── */}
      <button onClick={generate} disabled={loading} className="btn btn-accent"
        style={{ width: "100%", padding: "1rem", fontSize: "1rem", borderRadius: "var(--r2)", marginTop: "0.25rem" }}>
        {loading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="anim-spin">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
              <path d="M12 2A10 10 0 0 1 22 12"/>
            </svg>
            الذكاء الاصطناعي يبني أسئلتك…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            ابدأ الاختبار
          </>
        )}
      </button>

      {loading && (
        <p className="anim-fade" style={{ textAlign: "center", color: "var(--t3)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>
          عادةً أقل من ٣٠ ثانية
        </p>
      )}
    </div>
  );
}