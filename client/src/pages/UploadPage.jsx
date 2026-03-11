// client/src/pages/UploadPage.jsx
import React, { useState } from "react";
import FileUpload from "../components/FileUpload";
import QuizConfig from "../components/QuizConfig";
import Loader     from "../components/Loader";

const DEFAULT_CONFIG = { questionType: "mcq", questionCount: 5, difficulty: "medium" };

export default function UploadPage({ onQuizReady }) {
  const [file,      setFile]      = useState(null);
  const [session,   setSession]   = useState(null); // { sessionId, preview, charCount, fileName }
  const [config,    setConfig]    = useState(DEFAULT_CONFIG);
  const [stage,     setStage]     = useState("idle"); // idle | uploading | generating
  const [uploadPct, setUploadPct] = useState(0);
  const [error,     setError]     = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  function handleConfigChange(key, value) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  // Called by FileUpload after successful /api/upload
  function handleUploadDone(sessionData) {
    setSession(sessionData);
    setError("");
  }

  async function handleGenerate() {
    if (!session?.sessionId) return;
    setError("");
    setStage("generating");
    try {
      const res = await fetch("/api/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId:     session.sessionId,
          questionCount: config.questionCount,
          questionType:  config.questionType,
          difficulty:    config.difficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل توليد الأسئلة.");
      onQuizReady(data.questions, config);
    } catch (err) {
      setError(err.message || "حدث خطأ غير متوقع.");
      setStage("idle");
    }
  }

  // FileUpload calls these to track its own upload stage
  function handleUploadStart() { setStage("uploading"); setUploadPct(0); setSession(null); }
  function handleUploadProgress(pct) { setUploadPct(pct); }
  function handleUploadError(msg)    { setError(msg); setStage("idle"); }
  function handleFileCleared()       { setSession(null); setStage("idle"); setError(""); }

  const isLoading = stage !== "idle";
  const ready     = !!session?.sessionId && !isLoading;

  return (
    <div style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="animate-slide-up" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(240,165,0,0.2), rgba(240,165,0,0.05))", border: "1px solid rgba(240,165,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: "0 0 0.5rem", background: "linear-gradient(135deg, var(--gold-300), var(--gold-500))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          مولّد الاختبارات العربي
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "1rem" }}>
          ارفع ملفك الدراسي واحصل على اختبار عربي مخصص في ثوانٍ
        </p>
      </div>

      {/* ── Upload card ──────────────────────────────────────────────────── */}
      <div className="card card-accent animate-slide-up stagger-1" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          ① رفع الملف
        </h2>
        <FileUpload
          onFileSelect={setFile}
          onUploadStart={handleUploadStart}
          onUploadProgress={handleUploadProgress}
          onUploadDone={handleUploadDone}
          onUploadError={handleUploadError}
          onFileCleared={handleFileCleared}
          disabled={isLoading}
        />

        {/* ── Text preview accordion ──────────────────────────────────── */}
        {session?.preview && (
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={() => setPreviewOpen((v) => !v)}
              style={{
                width: "100%", background: "rgba(240,165,0,0.05)", border: "1px solid rgba(240,165,0,0.15)",
                borderRadius: 8, padding: "0.6rem 1rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "Cairo, sans-serif",
                fontWeight: 600,
              }}
            >
              <span>
                معاينة النص المستخرج —{" "}
                <span style={{ color: "var(--gold-400)" }}>{session.charCount.toLocaleString("ar")} حرف</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" style={{ transition: "transform 0.25s", transform: previewOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="3 6 8 11 13 6"/>
              </svg>
            </button>

            {previewOpen && (
              <div className="animate-slide-up" style={{
                marginTop: "0.5rem", padding: "0.9rem 1rem",
                background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-subtle)",
                borderRadius: 8, fontSize: "0.83rem", lineHeight: 1.8,
                color: "var(--text-muted)", maxHeight: 180, overflowY: "auto",
                whiteSpace: "pre-wrap", direction: "rtl", fontFamily: "Cairo, sans-serif",
              }}>
                {session.preview}
              </div>
            )}
          </div>
        )}

        {/* Upload progress bar */}
        {stage === "uploading" && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>جاري استخراج النص…</span>
              <span style={{ color: "var(--gold-400)", fontWeight: 700, fontSize: "0.85rem" }}>{uploadPct}٪</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadPct}%` }} /></div>
          </div>
        )}
      </div>

      {/* ── Config card ──────────────────────────────────────────────────── */}
      <div className="card card-accent animate-slide-up stagger-2" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ margin: "0 0 1.5rem", fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          ② إعدادات الاختبار
        </h2>
        <QuizConfig config={config} onChange={handleConfigChange} disabled={isLoading} />
      </div>

      {/* ── Generating indicator ──────────────────────────────────────────── */}
      {stage === "generating" && (
        <div className="card animate-fade-in" style={{ marginBottom: "1.25rem" }}>
          <Loader message="يعمل الذكاء الاصطناعي على توليد الأسئلة بالعربية…" />
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="alert-error animate-fade-in" style={{ marginBottom: "1.25rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── Generate button ───────────────────────────────────────────────── */}
      <div className="animate-slide-up stagger-3" style={{ textAlign: "center" }}>
        <button className="btn-primary" onClick={handleGenerate} disabled={!ready}
          style={{ width: "100%", fontSize: "1.1rem", padding: "0.9rem 2rem" }}>
          {stage === "generating" ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2 A10 10 0 0 1 22 12"/>
              </svg>
              جاري التوليد…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              توليد الاختبار
            </>
          )}
        </button>
        {!session && !isLoading && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.6rem" }}>
            يرجى رفع ملف أولاً للمتابعة
          </p>
        )}
      </div>
    </div>
  );
}
