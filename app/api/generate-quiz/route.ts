import { NextRequest, NextResponse } from "next/server";
import { generateQuiz } from "@/lib/generateQuiz";
import type { QuizSettings } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, settings } = body as {
      text: string;
      settings: QuizSettings;
    };

    if (!text || typeof text !== "string" || text.trim().length < 50) {
      return NextResponse.json(
        { error: "النص المُستخرج غير كافٍ لتوليد أسئلة." },
        { status: 400 }
      );
    }

    if (!settings || !settings.questionType || !settings.difficulty) {
      return NextResponse.json(
        { error: "إعدادات الاختبار غير مكتملة." },
        { status: 400 }
      );
    }

    const numQuestions = Math.min(Math.max(Number(settings.numQuestions) || 5, 1), 20);

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error:
            "مفتاح API غير موجود. يُرجى إضافة ANTHROPIC_API_KEY في ملف .env.local",
        },
        { status: 500 }
      );
    }

    const questions = await generateQuiz(text, {
      ...settings,
      numQuestions,
    });

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    console.error("Quiz generation error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "حدث خطأ أثناء توليد الأسئلة. يُرجى المحاولة مرة أخرى.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
