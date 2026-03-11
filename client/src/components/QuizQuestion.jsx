// client/src/components/QuizQuestion.jsx
import React, { useState } from "react";

const OPTION_KEYS = ["أ", "ب", "ج", "د"];

/**
 * Renders a single quiz question based on its type.
 *
 * @param {{
 *   question: object,
 *   index: number,
 *   total: number,
 *   onAnswer: (answer: string) => void,
 *   submitted: boolean,
 *   userAnswer: string | null,
 * }} props
 */
export default function QuizQuestion({
  question,
  index,
  total,
  onAnswer,
  submitted,
  userAnswer,
}) {
  const [localText, setLocalText] = useState("");

  const isCorrect = submitted && userAnswer?.trim() !== "" &&
    (question.type === "shortanswer"
      ? true // short answer graded loosely on results page
      : userAnswer === question.answer);

  function handleOptionClick(key) {
    if (submitted) return;
    onAnswer(key);
  }

  function handleShortSubmit() {
    if (!localText.trim()) return;
    onAnswer(localText.trim());
  }

  return (
    <div className="animate-slide-up" style={{ width: "100%" }}>

      {/* ── Progress & counter ─────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
            السؤال {index + 1} من {total}
          </span>
          <span style={{ color: "var(--gold-400)", fontSize: "0.85rem", fontWeight: 700 }}>
            {Math.round(((index) / total) * 100)}٪
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((index) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Question card ──────────────────────────────────────────────── */}
      <div className="card card-accent" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          {/* Index badge */}
          <div style={{
            flexShrink: 0,
            width: 38, height: 38,
            borderRadius: "50%",
            background: "rgba(240,165,0,0.12)",
            border: "1px solid rgba(240,165,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--gold-400)", fontWeight: 800, fontSize: "0.9rem",
          }}>
            {index + 1}
          </div>

          <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.65, flex: 1 }}>
            {question.question}
          </p>
        </div>
      </div>

      {/* ── MCQ / True-False options ───────────────────────────────────── */}
      {(question.type === "mcq" || question.type === "truefalse") && question.options && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {Object.entries(question.options).map(([key, text]) => {
            const isSelected = userAnswer === key;
            const showCorrect = submitted && key === question.answer;
            const showWrong   = submitted && isSelected && key !== question.answer;

            return (
              <button
                key={key}
                className={`answer-option${isSelected && !submitted ? " selected" : ""}${showCorrect ? " correct" : ""}${showWrong ? " wrong" : ""}`}
                onClick={() => handleOptionClick(key)}
                disabled={submitted}
              >
                {/* Key label */}
                <span style={{
                  flexShrink: 0,
                  width: 30, height: 30,
                  borderRadius: "50%",
                  border: `1.5px solid currentColor`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.82rem", fontWeight: 700, opacity: 0.85,
                }}>
                  {key}
                </span>

                <span style={{ flex: 1, textAlign: "right" }}>{text}</span>

                {/* Result icon */}
                {showCorrect && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {showWrong && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05C5C" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Short answer input ─────────────────────────────────────────── */}
      {question.type === "shortanswer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <textarea
            className="input-field"
            placeholder="اكتب إجابتك هنا..."
            value={submitted ? (userAnswer || "") : localText}
            onChange={(e) => setLocalText(e.target.value)}
            disabled={submitted}
            rows={3}
            style={{
              resize: "vertical",
              minHeight: 90,
              fontFamily: '"Cairo", serif',
              fontSize: "0.95rem",
            }}
          />
          {!submitted && (
            <button
              className="btn-primary"
              onClick={handleShortSubmit}
              disabled={!localText.trim()}
              style={{ alignSelf: "flex-end" }}
            >
              تأكيد الإجابة
            </button>
          )}
          {submitted && (
            <div style={{
              padding: "0.85rem 1rem",
              borderRadius: 9,
              background: "rgba(240,165,0,0.08)",
              border: "1px solid rgba(240,165,0,0.25)",
              fontSize: "0.9rem",
              color: "var(--gold-300)",
            }}>
              <span style={{ fontWeight: 700, color: "var(--gold-400)" }}>الإجابة النموذجية: </span>
              {question.answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
