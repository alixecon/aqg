"use client";
import { useState, useRef, useCallback } from "react";

interface FileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
  onError: (msg: string) => void;
}

const ACCEPTED = ".pdf,.docx,.pptx";

export default function FileUpload({ onTextExtracted, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setLoadingMsg("جارٍ قراءة الملف...");
      onError("");

      try {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const allowed = ["pdf", "docx", "pptx"];
        if (!ext || !allowed.includes(ext)) {
          throw new Error("نوع الملف غير مدعوم. يُرجى رفع ملف PDF أو DOCX أو PPTX.");
        }

        setLoadingMsg("جارٍ استخراج النص من الملف...");

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/extract-text", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "فشل في استخراج النص من الملف.");
        }

        onTextExtracted(data.text, data.fileName);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "حدث خطأ أثناء معالجة الملف.";
        onError(msg);
      } finally {
        setIsLoading(false);
        setLoadingMsg("");
      }
    },
    [onTextExtracted, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input value so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="animate-slide-up">
      {/* Hero header */}
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
          style={{ background: "linear-gradient(135deg, #0F4C5C, #1a6b80)" }}
        >
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="font-display text-4xl font-black mb-3" style={{ color: "var(--color-primary)" }}>
          مولِّد الاختبارات العربية
        </h1>
        <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
          ارفع ملفك الدراسي وسنُنشئ لك اختباراً تفاعلياً بالعربية في ثوانٍ
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`card relative overflow-hidden cursor-pointer transition-all duration-300 ${
          isDragging ? "scale-[1.01]" : ""
        }`}
        style={{
          border: isDragging
            ? "2px dashed var(--color-primary)"
            : "2px dashed var(--color-border)",
          background: isDragging
            ? "rgba(15, 76, 92, 0.04)"
            : "var(--color-surface)",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-5">
          {isLoading ? (
            <>
              {/* Spinner */}
              <div className="relative w-16 h-16">
                <div
                  className="absolute inset-0 rounded-full border-4"
                  style={{ borderColor: "var(--color-border)" }}
                />
                <div
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-current"
                  style={{
                    color: "var(--color-primary)",
                    animation: "spin 0.9s linear infinite",
                  }}
                />
              </div>
              <p className="font-display font-semibold text-lg" style={{ color: "var(--color-primary)" }}>
                {loadingMsg}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                قد يستغرق هذا بضع ثوانٍ حسب حجم الملف
              </p>
            </>
          ) : (
            <>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(15,76,92,0.08)" }}
              >
                <svg className="w-8 h-8" style={{ color: "var(--color-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="font-display text-xl font-bold mb-1" style={{ color: "var(--color-primary)" }}>
                  اسحب الملف هنا أو انقر للاختيار
                </p>
                <p style={{ color: "var(--color-text-muted)" }}>
                  الصيغ المدعومة: PDF · DOCX · PPTX
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {["PDF", "DOCX", "PPTX"].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-4 py-1.5 rounded-full text-sm font-bold"
                    style={{
                      background: "rgba(15,76,92,0.08)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {fmt}
                  </span>
                ))}
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                الحجم الأقصى: 15 ميجابايت
              </p>
            </>
          )}
        </div>

        {/* Decorative corner accent */}
        <div
          className="absolute top-0 left-0 w-24 h-24 opacity-10"
          style={{
            background: "radial-gradient(circle at 0% 0%, var(--color-gold), transparent)",
          }}
        />
      </div>

      {/* Features row */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[
          { icon: "🎯", label: "أسئلة ذكية", desc: "من محتوى ملفك فقط" },
          { icon: "🌐", label: "عربي بالكامل", desc: "واجهة وأسئلة وشرح" },
          { icon: "⚡", label: "توليد فوري", desc: "نتائج في ثوانٍ معدودة" },
        ].map((f) => (
          <div key={f.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{f.icon}</div>
            <p className="font-display font-bold text-sm" style={{ color: "var(--color-primary)" }}>
              {f.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
