// server/routes/generate.js
const express = require("express");
const router  = express.Router();
const { generateQuiz } = require("../services/quizGenerator");
const { getSession }   = require("../services/sessionStore");

// POST /api/generate
// Accepts sessionId (not raw text) — looks up text from server-side store
router.post("/", async (req, res) => {
  const { sessionId, questionCount, questionType, difficulty } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "معرّف الجلسة مفقود. يرجى رفع الملف أولاً." });
  }
  if (!questionCount) return res.status(400).json({ error: "يرجى تحديد عدد الأسئلة." });
  if (!questionType)  return res.status(400).json({ error: "يرجى تحديد نوع الأسئلة." });
  if (!difficulty)    return res.status(400).json({ error: "يرجى تحديد مستوى الصعوبة." });

  const count = parseInt(questionCount);
  if (isNaN(count) || count < 1 || count > 20)
    return res.status(400).json({ error: "عدد الأسئلة يجب أن يكون بين 1 و 20." });

  const validTypes = ["mcq", "truefalse", "shortanswer"];
  if (!validTypes.includes(questionType))
    return res.status(400).json({ error: "نوع السؤال غير صحيح." });

  const validDiffs = ["easy", "medium", "hard"];
  if (!validDiffs.includes(difficulty))
    return res.status(400).json({ error: "مستوى الصعوبة غير صحيح." });

  // Retrieve text from session store
  const session = getSession(sessionId);
  if (!session) {
    return res.status(410).json({
      error: "انتهت صلاحية الجلسة أو الملف غير موجود. يرجى رفع الملف مجدداً.",
    });
  }

  try {
    const questions = await generateQuiz(session.text, { questionCount: count, questionType, difficulty });
    return res.status(200).json({ success: true, questionCount: questions.length, questionType, difficulty, questions });
  } catch (err) {
    console.error("[generate route]", err.message);
    return res.status(500).json({ error: err.message || "فشل توليد الأسئلة." });
  }
});

module.exports = router;
