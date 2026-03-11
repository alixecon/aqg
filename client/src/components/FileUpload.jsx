// client/src/components/FileUpload.jsx
// Now owns the /api/upload call and emits sessionId to parent.
import React, { useRef, useState } from "react";

const ACCEPTED    = ".pdf,.docx,.pptx";
const MAX_MB      = 20;
const FILE_ICONS  = {
  ".pdf":  { label: "PDF",  color: "#E05C5C", bg: "rgba(224,92,92,0.12)" },
  ".docx": { label: "DOCX", color: "#5B9BD5", bg: "rgba(91,155,213,0.12)" },
  ".pptx": { label: "PPTX", color: "#F0A500", bg: "rgba(240,165,0,0.12)" },
};

function formatBytes(b) {
  if (b < 1024)       return `${b} B`;
  if (b < 1048576)    return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

/**
 * Props:
 *   onUploadStart    ()
 *   onUploadProgress (pct: number)
 *   onUploadDone     ({ sessionId, preview, charCount, fileName })
 *   onUploadError    (msg: string)
 *   onFileCleared    ()
 *   disabled         boolean
 */
export default function FileUpload({
  onUploadStart, onUploadProgress, onUploadDone, onUploadError, onFileCleared,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [dragging,      setDragging]      = useState(false);
  const [selectedFile,  setSelectedFile]  = useState(null);
  const [uploadState,   setUploadState]   = useState("idle"); // idle | uploading | done | error
  const [localError,    setLocalError]    = useState("");

  async function processFile(file) {
    setLocalError("");
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!Object.keys(FILE_ICONS).includes(ext)) {
      setLocalError("نوع الملف غير مدعوم. يُرجى رفع PDF أو DOCX أو PPTX فقط.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setLocalError(`حجم الملف يتجاوز ${MAX_MB} ميغابايت.`);
      return;
    }

    setSelectedFile(file);
    setUploadState("uploading");
    onUploadStart?.();

    // Simulate progress (XHR would give real progress; fetch doesn't)
    let pct = 0;
    const ticker = setInterval(() => {
      pct = Math.min(pct + Math.random() * 18, 85);
      onUploadProgress?.(Math.round(pct));
    }, 220);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      clearInterval(ticker);
      onUploadProgress?.(100);

      if (!res.ok) throw new Error(data.error || "فشل رفع الملف.");

      setUploadState("done");
      onUploadDone?.({ sessionId: data.sessionId, preview: data.preview, charCount: data.charCount, fileName: data.fileName });
    } catch (err) {
      clearInterval(ticker);
      setUploadState("error");
      setLocalError(err.message || "فشل الاتصال بالخادم.");
      onUploadError?.(err.message || "فشل الاتصال بالخادم.");
    }
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }

  function handleInputChange(e) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  }

  function handleRemove(e) {
    e.stopPropagation();
    setSelectedFile(null); setUploadState("idle"); setLocalError("");
    onFileCleared?.();
  }

  const ext  = selectedFile ? "." + selectedFile.name.split(".").pop().toLowerCase() : null;
  const icon = ext ? FILE_ICONS[ext] : null;

  return (
    <div className="animate-slide-up" style={{ width: "100%" }}>
      <div
        className={`upload-zone${dragging ? " dragging" : ""}${selectedFile ? " has-file" : ""}`}
        onClick={() => !disabled && !selectedFile && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{ cursor: disabled || selectedFile ? "default" : "pointer" }}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: "none" }}
               onChange={handleInputChange} disabled={disabled} />

        {!selectedFile ? (
          /* ── Empty state ── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(240,165,0,0.1)", border: "1px solid rgba(240,165,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>
                {dragging ? "أفلت الملف هنا" : "اسحب وأفلت ملفك هنا"}
              </p>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                أو انقر للاختيار من جهازك
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              {Object.entries(FILE_ICONS).map(([type, meta]) => (
                <span key={type} style={{ padding: "0.2rem 0.7rem", borderRadius: "999px", background: meta.bg, color: meta.color, fontSize: "0.78rem", fontWeight: 700, border: `1px solid ${meta.color}40` }}>{meta.label}</span>
              ))}
              <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", padding: "0.2rem 0.5rem" }}>حتى {MAX_MB} MB</span>
            </div>
          </div>
        ) : (
          /* ── File selected ── */
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", justifyContent: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: icon?.bg, border: `1px solid ${icon?.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: icon?.color }}>
              {icon?.label}
            </div>
            <div style={{ textAlign: "right", flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedFile.name}
              </p>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem" }}>
                {uploadState === "uploading" && <span style={{ color: "var(--gold-400)" }}>جاري الاستخراج…</span>}
                {uploadState === "done"      && <span style={{ color: "#4CAF7D" }}>✓ تم استخراج النص بنجاح · {formatBytes(selectedFile.size)}</span>}
                {uploadState === "error"     && <span style={{ color: "#E05C5C" }}>فشل الاستخراج</span>}
                {uploadState === "idle"      && <span style={{ color: "var(--text-muted)" }}>{formatBytes(selectedFile.size)}</span>}
              </p>
            </div>
            {uploadState !== "uploading" && (
              <button onClick={handleRemove} style={{ background: "rgba(224,92,92,0.12)", border: "1px solid rgba(224,92,92,0.3)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#F09090", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {localError && (
        <div className="alert-error animate-fade-in" style={{ marginTop: "0.75rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{localError}</span>
        </div>
      )}
    </div>
  );
}
