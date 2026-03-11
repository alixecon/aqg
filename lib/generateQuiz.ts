import Anthropic from "@anthropic-ai/sdk";
import type { QuizQuestion, QuizSettings } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Map internal keys to natural Arabic labels used in the prompt
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "سهل – أسئلة مباشرة تختبر الحفظ والفهم الأساسي",
  medium: "متوسط – أسئلة تتطلب الفهم العميق والتحليل",
  hard: "صعب – أسئلة تتطلب التحليل النقدي والاستنتاج",
};

const TYPE_INSTRUCTIONS: Record<string, string> = {
  "multiple-choice": `أسئلة اختيار من متعدد (MCQ).
لكل سؤال:
- اكتب السؤال بوضوح
- أعطِ 4 خيارات مُرقَّمة: أ، ب، ج، د
- حدّد الإجابة الصحيحة بالكامل (مثل: "أ) النص الكامل للإجابة")
- أضف شرحاً مختصراً من 1-2 جملة`,

  "true-false": `أسئلة صح أو خطأ.
لكل سؤال:
- اكتب عبارة واضحة قابلة للتحقق من المحتوى
- الإجابة الصحيحة: "صح" أو "خطأ"
- أضف شرحاً مختصراً يوضح السبب`,

  "short-answer": `أسئلة إجابات قصيرة.
لكل سؤال:
- اكتب سؤالاً محدداً يمكن الإجابة عنه بجملة أو جملتين
- أعطِ نموذج إجابة مثالياً من المحتوى
- أضف شرحاً مختصراً يدعم الإجابة`,
};

export async function generateQuiz(
  extractedText: string,
  settings: QuizSettings
): Promise<QuizQuestion[]> {
  const { numQuestions, questionType, difficulty } = settings;

  // Truncate very long documents to stay within reasonable token limits
  const MAX_CHARS = 12000;
  const content =
    extractedText.length > MAX_CHARS
      ? extractedText.slice(0, MAX_CHARS) +
        "\n\n[... تم اقتصار المحتوى لأغراض المعالجة ...]"
      : extractedText;

  const typeInstruction = TYPE_INSTRUCTIONS[questionType];
  const difficultyLabel = DIFFICULTY_LABELS[difficulty];

  const systemPrompt = `أنت مولِّد اختبارات تعليمية عربي متخصص.
مهمتك: توليد أسئلة اختبار باللغة العربية الفصحى الحديثة بناءً على محتوى الملف المُقدَّم فقط.

قواعد صارمة:
1. جميع النصوص في الإخراج يجب أن تكون بالعربية (السؤال، الخيارات، الإجابة، الشرح).
2. لا تخترع معلومات غير موجودة في المحتوى.
3. الأسئلة يجب أن تفيد الطالب في المراجعة.
4. إذا كان المحتوى بلغة أخرى، افهمه واكتب الأسئلة بالعربية.
5. استخدم مصطلحات تقنية بالعربية مع المصطلح الإنجليزي بين قوسين عند الحاجة.

شكل الإخراج: JSON صالح فقط، بدون أي نص خارجه، بدون backticks.`;

  const userPrompt = `المحتوى التعليمي:
---
${content}
---

المطلوب: أنشئ ${numQuestions} سؤالاً من نوع: ${typeInstruction}

مستوى الصعوبة: ${difficultyLabel}

أعد JSON array بهذا الشكل بالضبط:
[
  {
    "id": 1,
    "type": "${questionType}",
    "question": "نص السؤال بالعربية؟",
    ${
      questionType === "multiple-choice"
        ? `"options": ["أ) الخيار الأول", "ب) الخيار الثاني", "ج) الخيار الثالث", "د) الخيار الرابع"],`
        : questionType === "true-false"
        ? `"options": ["صح", "خطأ"],`
        : `"options": null,`
    }
    "correctAnswer": "الإجابة الصحيحة الكاملة",
    "explanation": "شرح مختصر من 1-2 جملة يوضح السبب"
  }
]

أعد ${numQuestions} سؤالاً فقط. JSON فقط، بدون أي نص إضافي.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip potential markdown fences
  const jsonStr = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let questions: QuizQuestion[];
  try {
    questions = JSON.parse(jsonStr);
  } catch {
    // Try to extract JSON array from response
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("فشل في تحليل الأسئلة المُولَّدة. حاول مرة أخرى.");
    }
    questions = JSON.parse(match[0]);
  }

  // Validate and sanitize questions
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("لم يتم توليد أي أسئلة. تأكد من أن الملف يحتوي على محتوى كافٍ.");
  }

  return questions.slice(0, numQuestions).map((q, idx) => ({
    id: idx + 1,
    type: q.type ?? questionType,
    question: q.question ?? "",
    options: Array.isArray(q.options) ? q.options : undefined,
    correctAnswer: q.correctAnswer ?? "",
    explanation: q.explanation ?? "",
  }));
}
