import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مولّد الاختبارات العربية",
  description: "ارفع ملفاتك الدراسية وأنشئ اختبارات تفاعلية بالعربية",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700;800;900&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-arabic antialiased">{children}</body>
    </html>
  );
}
