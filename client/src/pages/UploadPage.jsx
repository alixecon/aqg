// UploadPage.jsx
// الفلسفة: صفحة واحدة، فعل واحد، لا ادعاءات
// المستخدم يرى: عنوان + منطقة رفع + شرح بسيط
// الإقناع يأتي من سهولة الاستخدام، لا من النص

import React, { useState, useRef } from "react";

const FORMATS = [
  { icon: "📄", label: "PDF" },
  { icon: "📝", label: "Word" },
  { icon: "📊", label: "PowerPoint" },
];

export default function UploadPage({ onFileReady }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct]           = useState(0);
  const [error, setError]       = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef(null);

  async function upload(file) {
    if (!file) return;
    setError(""); setUploading(true); setPct(0); setFileName(file.name);

    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 90));
    };

    xhr.onload = () => {
      setPct(100);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status !== 200) { setError(data.error || "فشل رفع الملف"); setUploading(false); return; }
        setTimeout(() => { setUploading(false); onFileReady(data); }, 300);
      } catch { setError("استجابة غير متوقعة من الخادم"); setUploading(false); }
    };

    xhr.onerror = () => { setError("تعذّر الاتصال بالخادم"); setUploading(false); };
    xhr.open("POST", "/api/upload");
    xhr.send(form);
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) upload(f);
  }

  return (
    <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

      {/* ── Hero — قصير ومباشر ── */}
      <div style={{ textAlign: "center", paddingTop: "1rem" }}>
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 2.9rem)",
          fontWeight: 900, letterSpacing: "-0.02em",
          color: "var(--white)", marginBottom: "1rem",
          lineHeight: 1.2,
        }}>
          حوّل ملفك إلى اختبار<br />
          <span style={{ color: "var(--accent)" }}>في ثوانٍ</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.05rem", maxWidth: 420, margin: "0 auto" }}>
          ارفع ملفك الدراسي — الذكاء الاصطناعي يبني الأسئلة، أنت تكتشف أين تقف
        </p>
      </div>

      {/* ── Drop Zone — الفعل الوحيد ── */}
      <div
        className={`drop-zone${dragging ? " over" : ""}${uploading ? " done" : ""}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{ cursor: uploading ? "default" : "pointer" }}
      >
        <input
          ref={inputRef} type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
        />

        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
            {/* اسم الملف */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: "var(--accent-lo)", border: "1px solid rgba(232,114,42,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-hi)" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--white)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>جاري المعالجة…</div>
              </div>
            </div>

            {/* Progress */}
            <div style={{ width: "100%", maxWidth: 320 }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>استخراج النص</span>
                <span style={{ fontSize: "0.75rem", color: "var(--accent-hi)", fontWeight: 700 }}>{pct}٪</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
            {/* Upload icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: "var(--ink-700)", border: "1px solid var(--border-hi)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--white)", marginBottom: "0.35rem" }}>
                {dragging ? "أفلت الملف هنا" : "اسحب ملفك أو انقر للاختيار"}
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                النص لا يُحفظ · يُحذف فور المعالجة
              </p>
            </div>

            {/* Formats */}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              {FORMATS.map(f => (
                <span key={f.label} style={{
                  display: "flex", alignItems: "center", gap: "0.3rem",
                  padding: "0.3rem 0.7rem", borderRadius: 999,
                  background: "var(--ink-700)", border: "1px solid var(--border)",
                  fontSize: "0.78rem", color: "var(--muted)",
                }}>
                  <span>{f.icon}</span> {f.label}
                </span>
              ))}
            </div>
          </div>
        )}
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

      {/* ── الإثبات عبر الشفافية لا الادعاء ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem",
        borderTop: "1px solid var(--border)", paddingTop: "2rem",
      }}>
        {[
          { icon: "🗑️", title: "خصوصيتك أولاً",   body: "ملفك يُحذف تلقائياً بعد توليد الاختبار مباشرةً" },
          { icon: "⚡", title: "بدون تسجيل",        body: "لا حساب ولا بريد ولا كلمة مرور — ابدأ فوراً" },
          { icon: "🎯", title: "أسئلة من محتواك",   body: "الذكاء الاصطناعي يقرأ نصك ويبني أسئلة حقيقية منه" },
        ].map(c => (
          <div key={c.title} style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--white)", marginBottom: "0.3rem" }}>{c.title}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.5 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}