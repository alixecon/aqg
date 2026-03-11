"use client";

export default function GeneratingScreen() {
  const steps = [
    { icon: "🧠", label: "تحليل محتوى الملف" },
    { icon: "✍️", label: "صياغة الأسئلة بالعربية" },
    { icon: "🔍", label: "مراجعة الدقة والجودة" },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      {/* Animated ring */}
      <div className="relative w-28 h-28 mb-8">
        <div
          className="absolute inset-0 rounded-full border-4"
          style={{ borderColor: "var(--color-border)" }}
        />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent"
          style={{
            borderTopColor: "var(--color-primary)",
            borderRightColor: "var(--color-gold)",
            animation: "spin 1.2s linear infinite",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          ✨
        </div>
      </div>

      <h2
        className="font-display text-2xl font-black mb-2 text-center"
        style={{ color: "var(--color-primary)" }}
      >
        جارٍ توليد اختبارك...
      </h2>
      <p className="text-center mb-10" style={{ color: "var(--color-text-muted)" }}>
        الذكاء الاصطناعي يعمل على تحليل المحتوى وصياغة أسئلة بالعربية
      </p>

      {/* Steps */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {steps.map((step, i) => (
          <div
            key={step.label}
            className="flex items-center gap-4 px-5 py-3 rounded-xl animate-slide-up"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              animationDelay: `${i * 0.2}s`,
            }}
          >
            <span className="text-xl">{step.icon}</span>
            <span
              className="font-display font-semibold text-sm animate-pulse-soft"
              style={{ color: "var(--color-text)", animationDelay: `${i * 0.3}s` }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
