// App.jsx — flow: upload → config → quiz → results
import React, { useState } from "react";
import UploadPage  from "./pages/UploadPage";
import ConfigPage  from "./pages/ConfigPage";
import QuizPage    from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";

export default function App() {
  const [page,        setPage]        = useState("upload");
  const [session,     setSession]     = useState(null);   // { sessionId, fileName, charCount, preview }
  const [questions,   setQuestions]   = useState([]);
  const [quizConfig,  setQuizConfig]  = useState({});
  const [userAnswers, setUserAnswers]  = useState({});
  const [grades,      setGrades]      = useState({});

  function handleFileReady(sessionData) {
    setSession(sessionData);
    setPage("config");
  }

  function handleQuizReady(qs, cfg) {
    setQuestions(qs); setQuizConfig(cfg);
    setUserAnswers({}); setGrades({});
    setPage("quiz");
  }

  function handleQuizFinish(answers, gradingResults) {
    setUserAnswers(answers);
    setGrades(gradingResults || {});
    setPage("results");
  }

  function handleRetry() {
    setPage("upload");
    setSession(null); setQuestions([]);
    setUserAnswers({}); setGrades({}); setQuizConfig({});
  }

  function handleBackToConfig() {
    setPage("config");
  }

  // ── Steps indicator ──────────────────────────────────────────────────
  const STEPS = [
    { key: "upload", label: "الرفع" },
    { key: "config", label: "الإعداد" },
    { key: "quiz",   label: "الاختبار" },
    { key: "results",label: "النتائج" },
  ];
  const currentStep = STEPS.findIndex(s => s.key === page);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border)",
        background: "rgba(5,8,15,0.85)",
        backdropFilter: "blur(16px)",
        padding: "0 1.5rem",
      }}>
        <div style={{ maxWidth: 780, margin: "0 auto", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <button onClick={handleRetry} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem", padding: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-lo)", border: "1px solid rgba(232,114,42,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-hi)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--white)" }}>مولّد الاختبارات</span>
          </button>

          {/* Steps */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.3rem",
                  opacity: i > currentStep ? 0.3 : 1,
                  transition: "opacity 0.3s",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: i < currentStep ? "var(--green)" : i === currentStep ? "var(--accent)" : "var(--ink-600)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.6rem", fontWeight: 900,
                    color: i <= currentStep ? "#fff" : "var(--muted)",
                    transition: "all 0.3s",
                  }}>
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: i === currentStep ? "var(--white)" : "var(--muted)", display: window.innerWidth < 480 ? "none" : "inline" }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 20, height: 1, background: i < currentStep ? "var(--green)" : "var(--border)", transition: "background 0.3s", opacity: 0.6 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "3rem 1.5rem 5rem", maxWidth: 720, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {page === "upload"  && <UploadPage  onFileReady={handleFileReady} />}
        {page === "config"  && <ConfigPage  session={session} onQuizReady={handleQuizReady} onBack={handleRetry} />}
        {page === "quiz"    && <QuizPage    questions={questions} config={quizConfig} onFinish={handleQuizFinish} onBack={handleBackToConfig} />}
        {page === "results" && <ResultsPage questions={questions} userAnswers={userAnswers} grades={grades} config={quizConfig} onRetry={handleRetry} />}
      </main>

      <footer style={{ textAlign: "center", padding: "1.25rem", color: "var(--dim)", fontSize: "0.75rem", borderTop: "1px solid var(--border)" }}>
        مولّد الاختبارات العربي · مدعوم بـ Claude من Anthropic
      </footer>
    </div>
  );
}