import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/extractText";

// Maximum file size: 15 MB
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/x-pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
];
const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "pptx", "ppt"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "لم يتم تحديد ملف للرفع." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "حجم الملف يتجاوز الحد المسموح به (15 ميجابايت)." },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `نوع الملف "${ext}" غير مدعوم. يُرجى رفع ملف بصيغة PDF أو DOCX أو PPTX.`,
        },
        { status: 400 }
      );
    }

    // Validate MIME type (with fallback tolerance for browser inconsistencies)
    const mimeOk =
      ALLOWED_TYPES.includes(file.type) ||
      file.type === "" ||
      file.type === "application/octet-stream";
    if (!mimeOk) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم. يُرجى رفع ملف PDF أو DOCX أو PPTX." },
        { status: 400 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "الملف المرفوع فارغ أو تالف." },
        { status: 400 }
      );
    }

    // Extract text
    const text = await extractText(buffer, file.name, file.type);

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "تعذّر استخراج نص كافٍ من الملف. تأكد من أن الملف يحتوي على نصوص قابلة للقراءة وليس صوراً فقط.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text,
      fileName: file.name,
      charCount: text.length,
    });
  } catch (err: unknown) {
    console.error("Text extraction error:", err);
    const message =
      err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء معالجة الملف.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
