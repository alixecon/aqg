// server/services/quizGenerator.js
const Anthropic = require("@anthropic-ai/sdk");

const client     = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const TIMEOUT_MS = 45_000; // 45-second hard ceiling on Claude calls

// ─── Arabic character detection ───────────────────────────────────────────────
const ARABIC_RE = /[\u0600-\u06FF]/;

function containsArabic(str) {
  return ARABIC_RE.test(str);
}

/**
 * Verify that generated questions are actually in Arabic.
 * Throws if more than 20% of questions lack Arabic text.
 */
function assertArabicOutput(questions) {
  const nonArabic = questions.filter((q) => !containsArabic(q.question));
  if (nonArabic.length > Math.ceil(questions.length * 0.2)) {
    throw new Error(
      "الأسئلة المُولَّدة ليست بالعربية. يرجى المحاولة مرة أخرى."
    );
  }
}

// ─── Prompt builders ──────────────────────────────────────────────────────────
const DIFFICULTY_LABELS = { easy: "سهل", medium: "متوسط", hard: "صعب" };

const TYPE_INSTRUCTIONS = {
  mcq: `- نوع السؤال: اختيار من متعدد (MCQ)
- كل سؤال يجب أن يحتوي على أربعة خيارات (أ، ب، ج، د)
- خيار واحد فقط هو الصحيح
- JSON format:
  { "type":"mcq","question":"...","options":{"أ":"...","ب":"...","ج":"...","د":"..."},"answer":"أ","explanation":"..." }`,

  truefalse: `- نوع السؤال: صح أم خطأ
- كل سؤال جملة يُحكم عليها بـ "صح" أو "خطأ"
- JSON format:
  { "type":"truefalse","question":"...","options":{"أ":"صح","ب":"خطأ"},"answer":"صح","explanation":"..." }`,

  shortanswer: `- نوع السؤال: إجابة قصيرة
- JSON format:
  { "type":"shortanswer","question":"...","options":null,"answer":"الإجابة النموذجية","explanation":"..." }`,
};

function buildPrompt(text, { questionCount, questionType, difficulty }) {
  const systemPrompt = `أنت مولّد اختبارات تعليمية متخصص.
قاعدة مطلقة: جميع الأسئلة والخيارات والإجابات والشروحات يجب أن تكون باللغة العربية الفصحى حصراً، بصرف النظر عن لغة النص المُدخَل.
لا تختلق معلومات خارج المحتوى المُقدَّم.
ردّك: JSON صالح فقط، بدون أي نص أو markdown إضافي.`;

  const userPrompt = `المحتوى الدراسي:
\`\`\`
${text}
\`\`\`

ولّد ${questionCount} سؤالاً — مستوى الصعوبة: "${DIFFICULTY_LABELS[difficulty] || "متوسط"}".
${TYPE_INSTRUCTIONS[questionType]}

أعِد JSON فقط:
{ "questions": [ ... ] }`;

  return { systemPrompt, userPrompt };
}

// ─── Schema validation ────────────────────────────────────────────────────────
function validateQuestions(questions, expectedType) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("لم يتم توليد أي أسئلة. يرجى المحاولة مرة أخرى.");
  }

  for (let i = 0; i < questions.length; i++) {
    const q   = questions[i];
    const idx = `السؤال ${i + 1}`;

    if (typeof q.question !== "string" || !q.question.trim())
      throw new Error(`${idx}: نص السؤال مفقود.`);
    if (typeof q.answer !== "string" || !q.answer.trim())
      throw new Error(`${idx}: الإجابة مفقودة.`);
    if (typeof q.explanation !== "string" || !q.explanation.trim())
      throw new Error(`${idx}: الشرح مفقود.`);

    if (expectedType === "mcq") {
      if (!q.options || Object.keys(q.options).length !== 4)
        throw new Error(`${idx}: يجب أن يحتوي على 4 خيارات.`);
    }
    if (expectedType === "truefalse") {
      if (!q.options?.["أ"] || !q.options?.["ب"])
        throw new Error(`${idx}: خيارا صح/خطأ مفقودان.`);
    }
  }
}

// ─── Main generator ───────────────────────────────────────────────────────────
async function generateQuiz(text, options) {
  const { questionCount, questionType, difficulty } = options;

  if (!process.env.ANTHROPIC_API_KEY)
    throw new Error("مفتاح API غير مُعيَّن في ملف .env");
  if (!text || text.trim().length < 50)
    throw new Error("النص المُدخَل قصير جداً لتوليد أسئلة منه.");
  if (!["mcq", "truefalse", "shortanswer"].includes(questionType))
    throw new Error("نوع السؤال غير صحيح.");
  if (!["easy", "medium", "hard"].includes(difficulty))
    throw new Error("مستوى الصعوبة غير صحيح.");

  const count = parseInt(questionCount);
  if (isNaN(count) || count < 1 || count > 20)
    throw new Error("عدد الأسئلة يجب أن يكون بين 1 و 20.");

  const { systemPrompt, userPrompt } = buildPrompt(text, { questionCount: count, questionType, difficulty });

  // ── Timeout via AbortController ───────────────────────────────────────────
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await client.messages.create(
      {
        model:      "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system:     systemPrompt,
        messages:   [{ role: "user", content: userPrompt }],
      },
      { signal: controller.signal }
    );
  } catch (err) {
    if (err.name === "AbortError")
      throw new Error("انتهت مهلة توليد الأسئلة (45 ثانية). يرجى تقليل عدد الأسئلة أو المحاولة مرة أخرى.");
    if (err.status === 401) throw new Error("مفتاح API غير صحيح أو منتهي الصلاحية.");
    if (err.status === 429) throw new Error("تم تجاوز حد الطلبات. يرجى الانتظار ثم المحاولة مرة أخرى.");
    throw new Error("فشل الاتصال بخدمة الذكاء الاصطناعي.");
  } finally {
    clearTimeout(timer);
  }

  const rawContent = response.content?.[0]?.text || "";
  if (!rawContent) throw new Error("استجابة النموذج فارغة.");

  let parsed;
  try {
    const cleaned = rawContent
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[quizGenerator] JSON parse error. Raw:", rawContent.slice(0, 300));
    throw new Error("فشل تحليل استجابة النموذج. يرجى المحاولة مرة أخرى.");
  }

  const questions = parsed?.questions;
  validateQuestions(questions, questionType);
  assertArabicOutput(questions);   // ← Arabic language check

  return questions;
}

module.exports = { generateQuiz };
