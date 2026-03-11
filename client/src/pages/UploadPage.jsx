// UploadPage.jsx
import React, { useState, useRef } from "react";

const FORMATS = [
  { icon: "📄", label: "PDF" },
  { icon: "📝", label: "Word" },
  { icon: "📊", label: "PowerPoint" },
];

// ─── Page cap thresholds ───────────────────────────────────────────────────────
const PAGE_IDEAL = 15;   // ✅ green — ideal range
const PAGE_WARN  = 30;   // ⚠️ yellow — warn but allow
const PAGE_BLOCK = 50;   // ❌ red — block

function PageWarning({ pageCount, onContinue, onDiscard }) {
  const isBlocked = pageCount > PAGE_BLOCK;

  return (
    <div className="anim-fade" style={{
      borderRadius: "var(--r2)",
      border: `1px solid ${isBlocked ? "rgba(224,92,92,0.4)" : "rgba(245,158,11,0.4)"}`,
      background: isBlocked ? "rgba(224,92,92,0.06)" : "rgba(245,158,11,0.06)",
      padding: "1.5rem",
      display: "flex", flexDirection: "column", gap: "1.25rem",
    }}>
      {/* Icon + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
        <span style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0 }}>
          {isBlocked ? "🚫" : "⚠️"}
        </span>
        <div>
          <div style={{
            fontWeight: 800, fontSize: "0.97rem",
            color: isBlocked ? "#F09090" : "#FCD34D",
            marginBottom: "0.35rem",
            fontFamily: "Almarai, sans-serif",
          }}>
            {isBlocked
              ? `الملف كبير جداً (≈${pageCount} صفحة)`
              : `ملف طويل نسبياً (≈${pageCount} صفحة)`}
          </div>
          <p style={{
            fontSize: "0.85rem", color: "var(--muted)",
            lineHeight: 1.65, margin: 0,
            fontFamily: "Almarai, sans-serif",
          }}>
            {isBlocked
              ? `الحد الأقصى الموصى به هو ${PAGE_BLOCK} صفحة. الملفات الأكبر تُنتج أسئلة أضعف وتستهلك وقتاً أطول. قسّم الملف واختر الفصل الذي تريد مراجعته.`
              : `الجودة المثلى تكون مع ملفات حتى ${PAGE_IDEAL} صفحة. يمكنك المتابعة، لكن قد تكون الأسئلة أقل دقةً في الأجزاء البعيدة.`}
          </p>
        </div>
      </div>

      {/* Quality indicator */}
      <div style={{
        display: "flex", gap: "0.4rem", alignItems: "center",
        padding: "0.6rem 0.9rem",
        background: "var(--ink-700)", borderRadius: "var(--r)",
        fontSize: "0.78rem", color: "var(--muted)",
        fontFamily: "Almarai, sans-serif",
      }}>
        <span>جودة الأسئلة المتوقعة:</span>
        <div style={{ display: "flex", gap: "3px", marginRight: "0.25rem" }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              width: 22, height: 6, borderRadius: 3,
              background: isBlocked
                ? (i <= 1 ? "#E05C5C" : "var(--border)")
                : (i <= (pageCount > 40 ? 2 : 3) ? "#F59E0B" : "var(--border)"),
              transition: "background 0.2s",
            }}/>
          ))}
        </div>
        <span style={{ color: isBlocked ? "#F09090" : "#FCD34D", fontWeight: 700 }}>
          {isBlocked ? "ضعيفة" : pageCount > 40 ? "مقبولة" : "جيدة"}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.65rem" }}>
        <button
          onClick={onDiscard}
          className="btn btn-ghost"
          style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--r)", fontSize: "0.88rem" }}
        >
          رفع ملف آخر
        </button>
        {!isBlocked && (
          <button
            onClick={onContinue}
            className="btn btn-accent"
            style={{ flex: 2, padding: "0.75rem", borderRadius: "var(--r)", fontSize: "0.88rem" }}
          >
            متابعة على أي حال
          </button>
        )}
      </div>
    </div>
  );
}

export default function UploadPage({ onFileReady }) {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pct,       setPct]       = useState(0);
  const [error,     setError]     = useState("");
  const [fileName,  setFileName]  = useState("");
  // Pending data when page warning is shown
  const [pendingData, setPendingData] = useState(null);
  const inputRef = useRef(null);

  async function upload(file) {
    if (!file) return;
    setError(""); setUploading(true); setPct(0);
    setFileName(file.name); setPendingData(null);

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
        if (xhr.status !== 200) {
          setError(data.error || "رفع الملف فشل، حاول مرة ثانية");
          setUploading(false);
          return;
        }

        setUploading(false);

        const pages = data.pageCount || 1;

        // ✅ Ideal: proceed immediately
        if (pages <= PAGE_IDEAL) {
          onFileReady(data);
          return;
        }

        // ⚠️ Warn or ❌ Block: show warning first
        setPendingData(data);

      } catch {
        setError("استجابة غير متوقعة من الخادم");
        setUploading(false);
      }
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

  function handleDiscard() {
    setPendingData(null);
    setFileName("");
  }

  // Show page warning if we have pending data
  if (pendingData) {
    return (
      <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        <div style={{ textAlign: "center", paddingTop: "1rem" }}>
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 2.9rem)",
            fontWeight: 900, letterSpacing: "-0.02em",
            color: "var(--white)", marginBottom: "1rem", lineHeight: 1.2,
          }}>
            حوّل ملفك إلى اختبار<br />
            <span style={{ color: "var(--accent)" }}>في ثوانٍ</span>
          </h1>
        </div>
        <PageWarning
          pageCount={pendingData.pageCount}
          onContinue={() => { onFileReady(pendingData); setPendingData(null); }}
          onDiscard={handleDiscard}
        />
      </div>
    );
  }

  return (
    <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: "center", paddingTop: "1rem" }}>
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 2.9rem)",
          fontWeight: 900, letterSpacing: "-0.02em",
          color: "var(--white)", marginBottom: "1rem", lineHeight: 1.2,
        }}>
          حوّل ملفك إلى اختبار<br />
          <span style={{ color: "var(--accent)" }}>في ثوانٍ</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.05rem", maxWidth: 420, margin: "0 auto" }}>
          ارفع المحاضرات أو الدروس وخل الذكاء الاصطناعي يصيغ الأسئلة وقيم مستوى فهمك
        </p>
      </div>

      {/* ── Drop Zone ── */}
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

            {/* Page cap hint */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              fontSize: "0.74rem", color: "var(--muted)", opacity: 0.7,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>الجودة المثلى: حتى {PAGE_IDEAL} صفحة · الحد الأقصى: {PAGE_BLOCK} صفحة</span>
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

      {/* ── Trust signals ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem",
        borderTop: "1px solid var(--border)", paddingTop: "2rem",
      }}>
        {[
          { icon: "🗑️", title: "خصوصيتك أولاً",  body: "ملفك يُحذف تلقائياً بعد انشاء الاختبار مباشرةً" },
          { icon: "⚡", title: "بدون تسجيل",       body: "لا حساب ولا بريد ولا كلمة مرور — ابدأ فوراً" },
          { icon: "🎯", title: "أسئلة من محتواك",  body: "الذكاء الاصطناعي يقرأ نصك ويبني أسئلة حقيقية منه" },
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