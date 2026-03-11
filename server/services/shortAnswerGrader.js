// server/services/shortAnswerGrader.js
//
// Uses Claude to evaluate a student's short-answer response against
// the model answer, returning a structured verdict in Arabic.

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TIMEOUT_MS = 30_000;

/**
 * Grade a single short-answer response.
 *
 * @param {string} question       — the question text (Arabic)
 * @param {string} modelAnswer    — the correct model answer (Arabic)
 * @param {string} studentAnswer  — what the student wrote
 * @returns {Promise<{
 *   verdict: "correct" | "partial" | "incorrect",
 *   score:   0 | 0.5 | 1,
 *   feedback: string   (Arabic, 1–2 sentences)
 * }>}
 */
async function gradeShortAnswer(question, modelAnswer, studentAnswer) {
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return {
      verdict: "incorrect",
      score: 0,
      feedback: "لم يتم تقديم أي إجابة.",
    };
  }

  const systemPrompt = `أنت مُقيِّم أكاديمي متخصص في تصحيح إجابات الطلاب.
مهمتك: قيّم إجابة الطالب وقارنها بالإجابة النموذجية.
أعِد JSON فقط، بدون أي نص إضافي، بهذا الشكل الدقيق:
{
  "verdict": "correct" | "partial" | "incorrect",
  "score": 1 | 0.5 | 0,
  "feedback": "تعليق مختصر بالعربية الفصحى (جملة أو جملتان)"
}
معيار التقييم:
- correct (1):   الإجابة صحيحة وتشمل المفهوم الأساسي حتى لو بصياغة مختلفة
- partial (0.5): الإجابة جزئية أو تحتوي على الفكرة الرئيسية ناقصةً
- incorrect (0): الإجابة خاطئة أو لا صلة لها بالسؤال أو فارغة`;

  const userPrompt = `السؤال: ${question}
الإجابة النموذجية: ${modelAnswer}
إجابة الطالب: ${studentAnswer}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await client.messages.create(
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
      { signal: controller.signal }
    );
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("انتهت مهلة تقييم الإجابة. يرجى المحاولة مرة أخرى.");
    }
    console.error("[shortAnswerGrader] API error:", err.message);
    throw new Error("فشل تقييم الإجابة. يرجى المحاولة مرة أخرى.");
  } finally {
    clearTimeout(timeout);
  }

  const raw = response.content?.[0]?.text || "";
  let parsed;
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: return unevaluated
    return {
      verdict: "partial",
      score: 0.5,
      feedback: "تعذّر تقييم الإجابة تلقائياً. يرجى المراجعة يدوياً.",
    };
  }

  // Sanitise
  const validVerdicts = ["correct", "partial", "incorrect"];
  if (!validVerdicts.includes(parsed.verdict)) parsed.verdict = "partial";
  const scoreMap = { correct: 1, partial: 0.5, incorrect: 0 };
  parsed.score = scoreMap[parsed.verdict];

  return {
    verdict:  parsed.verdict,
    score:    parsed.score,
    feedback: parsed.feedback || "لا يوجد تعليق.",
  };
}

/**
 * Grade all short-answer questions in a quiz in parallel.
 *
 * @param {Array}  questions   — full questions array
 * @param {object} userAnswers — { [index]: answerString }
 * @returns {Promise<object>}  — { [index]: { verdict, score, feedback } }
 */
async function gradeAllShortAnswers(questions, userAnswers) {
  const tasks = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.type === "shortanswer");

  const results = await Promise.allSettled(
    tasks.map(({ q, i }) =>
      gradeShortAnswer(q.question, q.answer, userAnswers[i] || "")
    )
  );

  const graded = {};
  tasks.forEach(({ i }, taskIdx) => {
    const r = results[taskIdx];
    graded[i] =
      r.status === "fulfilled"
        ? r.value
        : { verdict: "partial", score: 0.5, feedback: "تعذّر التقييم التلقائي." };
  });

  return graded;
}

module.exports = { gradeShortAnswer, gradeAllShortAnswers };
