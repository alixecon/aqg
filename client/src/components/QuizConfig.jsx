// client/src/components/QuizConfig.jsx
import React from "react";

const QUESTION_TYPES = [
  { value: "mcq",         label: "اختيار متعدد",  icon: "◉" },
  { value: "truefalse",   label: "صح أم خطأ",     icon: "⊙" },
  { value: "shortanswer", label: "إجابة قصيرة",   icon: "✎" },
];

const DIFFICULTIES = [
  { value: "easy",   label: "سهل",    color: "#4CAF7D" },
  { value: "medium", label: "متوسط",  color: "#F0A500" },
  { value: "hard",   label: "صعب",    color: "#E05C5C" },
];

const QUESTION_COUNTS = [3, 5, 7, 10, 15, 20];

/**
 * Quiz configuration panel.
 * @param {{ config, onChange, disabled }} props
 *   config: { questionType, questionCount, difficulty }
 *   onChange: (key, value) => void
 */
export default function QuizConfig({ config, onChange, disabled = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* ── Question type ───────────────────────────────────────────────── */}
      <div>
        <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          نوع الأسئلة
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {QUESTION_TYPES.map((t) => (
            <button
              key={t.value}
              className={`option-pill${config.questionType === t.value ? " active" : ""}`}
              onClick={() => onChange("questionType", t.value)}
              disabled={disabled}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <span style={{ fontSize: "1rem", lineHeight: 1 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Number of questions ─────────────────────────────────────────── */}
      <div>
        <label style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <span>عدد الأسئلة</span>
          <span style={{ color: "var(--gold-400)", fontWeight: 800 }}>{config.questionCount}</span>
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              className={`option-pill${config.questionCount === n ? " active" : ""}`}
              onClick={() => onChange("questionCount", n)}
              disabled={disabled}
              style={{ minWidth: 52, textAlign: "center" }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Slider as additional UX */}
        <div style={{ marginTop: "0.75rem" }}>
          <input
            type="range"
            min={1}
            max={20}
            value={config.questionCount}
            disabled={disabled}
            onChange={(e) => onChange("questionCount", parseInt(e.target.value))}
            style={{
              width: "100%",
              accentColor: "var(--gold-500)",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
            <span>١</span>
            <span>٢٠</span>
          </div>
        </div>
      </div>

      {/* ── Difficulty ──────────────────────────────────────────────────── */}
      <div>
        <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          مستوى الصعوبة
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => onChange("difficulty", d.value)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: "0.6rem 0.5rem",
                borderRadius: 8,
                border: `1px solid ${config.difficulty === d.value ? d.color : "var(--border-subtle)"}`,
                background: config.difficulty === d.value ? `${d.color}18` : "var(--bg-elevated)",
                color: config.difficulty === d.value ? d.color : "var(--text-muted)",
                fontFamily: '"Cairo", serif',
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
              }}
            >
              {/* Dot */}
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: config.difficulty === d.value ? d.color : "var(--text-muted)",
                transition: "background 0.2s",
                flexShrink: 0,
              }} />
              {d.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
