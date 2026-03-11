import React, { useState, useEffect } from "react";
import UploadPage  from "./pages/UploadPage";
import ConfigPage  from "./pages/ConfigPage";
import QuizPage    from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const STEPS = [
  { key: "upload",  label: "الرفع" },
  { key: "config",  label: "الإعداد" },
  { key: "quiz",    label: "الاختبار" },
  { key: "results", label: "النتائج" },
];

export default function App() {
  const [page,        setPage]        = useState("upload");
  const [session,     setSession]     = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [quizConfig,  setQuizConfig]  = useState({});
  const [userAnswers, setUserAnswers]  = useState({});
  const [grades,      setGrades]      = useState({});

  // ── Theme ──────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem("aq_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("aq_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  // ── Navigation ────────────────────────────────────────────────────
  function handleFileReady(data)          { setSession(data); setPage("config"); }
  function handleQuizReady(qs, cfg)       { setQuestions(qs); setQuizConfig(cfg); setUserAnswers({}); setGrades({}); setPage("quiz"); }
  function handleQuizFinish(ans, gr)      { setUserAnswers(ans); setGrades(gr || {}); setPage("results"); }
  function handleRetry()                  { setPage("upload"); setSession(null); setQuestions([]); setUserAnswers({}); setGrades({}); setQuizConfig({}); }
  function handleBackToConfig()           { setPage("config"); }

  const stepIdx = STEPS.findIndex(s => s.key === page);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid var(--border-1)",
        background: theme === "dark" ? "rgba(6,13,24,0.88)" : "rgba(250,251,253,0.92)",
        backdropFilter: "blur(18px)",
        padding: "0 1.5rem",
        transition: "background 0.25s",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <button
            onClick={handleRetry}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.7rem",
              padding: 0,
            }}
          >
            <svg width="28" height="36" viewBox="0 0 52 66" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect
                x="1"
                y="1"
                width="50"
                height="64"
                rx="6"
                fill={theme === "dark" ? "#111820" : "#EDF2F9"}
                stroke={theme === "dark" ? "#1D2A3A" : "#D8E4F0"}
                strokeWidth="1.5"
              />
              <path
                d="M33 1 L51 1 L51 19 L33 19 Z"
                fill={theme === "dark" ? "#0C1118" : "#F4F7FB"}
              />
              <path
                d="M33 1 L51 19 L33 19 Z"
                fill="none"
                stroke="var(--a)"
                strokeWidth="1.5"
              />
              <line
                x1="9"
                y1="28"
                x2="28"
                y2="28"
                stroke={theme === "dark" ? "#1D2A3A" : "#D0DCEA"}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="9"
                y1="37"
                x2="25"
                y2="37"
                stroke={theme === "dark" ? "#1D2A3A" : "#D0DCEA"}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="9"
                y1="46"
                x2="30"
                y2="46"
                stroke={theme === "dark" ? "#1D2A3A" : "#D0DCEA"}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="40"
                cy="50"
                r="14"
                fill={theme === "dark" ? "#0C1118" : "#F4F7FB"}
                stroke="var(--a)"
                strokeWidth="1.5"
              />
              <polyline
                points="33,50 38.5,56 47,43"
                fill="none"
                stroke="var(--a)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div style={{ lineHeight: 1.2 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  color: "var(--t1)",
                  fontFamily: "Almarai, sans-serif",
                  display: "block",
                }}
              >
                صانع الاختبارات
              </span>
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "0.65rem",
                  color: "var(--a)",
                  fontFamily: "Almarai, sans-serif",
                  display: "block",
                  letterSpacing: "0.04em",
                }}
              >
                اختبر نفسك واعرف مستواك
              </span>
            </div>
          </button>
          

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Steps */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              {STEPS.map((s, i) => (
                <React.Fragment key={s.key}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.28rem", opacity: i > stepIdx ? 0.3 : 1, transition: "opacity 0.3s" }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: i < stepIdx ? "var(--green)" : i === stepIdx ? "var(--accent)" : "var(--bg-4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.58rem", fontWeight: 900,
                      color: i <= stepIdx ? "#fff" : "var(--text-3)",
                      transition: "all 0.3s",
                    }}>
                      {i < stepIdx ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "Almarai, sans-serif", color: i === stepIdx ? "var(--text-1)" : "var(--text-3)", display: window.innerWidth < 500 ? "none" : "inline" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 18, height: 1.5, background: i < stepIdx ? "var(--green)" : "var(--border-1)", transition: "background 0.3s", margin: "0 0.1rem", opacity: 0.7, marginBottom: "0.05rem" }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme} className="btn-theme" title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}>
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "2.5rem 1.5rem 5rem", maxWidth: 700, width: "100%", margin: "0 auto" }}>
        {page === "upload"  && <UploadPage  onFileReady={handleFileReady} />}
        {page === "config"  && <ConfigPage  session={session} onQuizReady={handleQuizReady} onBack={handleRetry} />}
        {page === "quiz"    && <QuizPage    questions={questions} config={quizConfig} onFinish={handleQuizFinish} onBack={handleBackToConfig} />}
        {page === "results" && <ResultsPage questions={questions} userAnswers={userAnswers} grades={grades} config={quizConfig} onRetry={handleRetry} />}
      </main>

      <footer style={{ textAlign: "center", padding: "1.1rem", color: "var(--text-3)", fontSize: "0.73rem", borderTop: "1px solid var(--border-1)", fontFamily: "Almarai, sans-serif" }}>
        مولّد الاختبارات العربي · مدعوم بـ Claude من Anthropic
      </footer>
    </div>
  );
}