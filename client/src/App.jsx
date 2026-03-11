// client/src/App.jsx
import React, { useState } from "react";
import UploadPage  from "./pages/UploadPage";
import QuizPage    from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";

// Pages: "upload" → "quiz" → "results"

export default function App() {
  const [page,        setPage]        = useState("upload");
  const [questions,   setQuestions]   = useState([]);
  const [quizConfig,  setQuizConfig]  = useState({});
  const [userAnswers, setUserAnswers]  = useState({});
  // grades: { [questionIndex]: { verdict, score, feedback } }
  const [grades,      setGrades]      = useState({});

  function handleQuizReady(qs, cfg) {
    setQuestions(qs);
    setQuizConfig(cfg);
    setUserAnswers({});
    setGrades({});
    setPage("quiz");
  }

  function handleQuizFinish(answers, gradingResults) {
    setUserAnswers(answers);
    setGrades(gradingResults || {});
    setPage("results");
  }

  function handleRetry() {
    setPage("upload");
    setQuestions([]);
    setUserAnswers({});
    setGrades({});
    setQuizConfig({});
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Top navigation bar ──────────────────────────────────────────────── */}
      <header style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(13,27,42,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
        padding: "0 1.5rem",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <button onClick={handleRetry} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem", padding: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, rgba(240,165,0,0.25), rgba(240,165,0,0.08))", border: "1px solid rgba(240,165,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)", fontFamily: '"Cairo", serif' }}>
              مولّد الاختبارات العربي
            </span>
          </button>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {[{ key: "upload", label: "الرفع" }, { key: "quiz", label: "الاختبار" }, { key: "results", label: "النتائج" }].map((s, i, arr) => (
              <React.Fragment key={s.key}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", opacity: page === s.key ? 1 : 0.45 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: page === s.key ? "var(--gold-500)" : "var(--bg-elevated)", border: `1px solid ${page === s.key ? "var(--gold-500)" : "var(--border-subtle)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, color: page === s.key ? "#0D1B2A" : "var(--text-muted)", transition: "all 0.3s ease" }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: page === s.key ? "var(--gold-400)" : "var(--text-muted)" }}>{s.label}</span>
                </div>
                {i < arr.length - 1 && <div style={{ width: 16, height: 1, background: "var(--border-subtle)" }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "2.5rem 1.5rem 4rem", maxWidth: 760, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {page === "upload"  && <UploadPage  onQuizReady={handleQuizReady} />}
        {page === "quiz"    && <QuizPage    questions={questions} config={quizConfig} onFinish={handleQuizFinish} onBack={handleRetry} />}
        {page === "results" && <ResultsPage questions={questions} userAnswers={userAnswers} grades={grades} config={quizConfig} onRetry={handleRetry} />}
      </main>

      <footer style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.78rem", borderTop: "1px solid var(--border-subtle)", opacity: 0.7 }}>
        مولّد الاختبارات العربي — مدعوم بالذكاء الاصطناعي من Anthropic Claude
      </footer>
    </div>
  );
}
