// server/routes/grade.js
const express = require("express");
const router  = express.Router();
const { gradeAllShortAnswers } = require("../services/shortAnswerGrader");

/**
 * POST /api/grade
 *
 * Body:
 * {
 *   questions:   Array   — full quiz questions array
 *   userAnswers: object  — { "0": "...", "2": "..." }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   grades: {
 *     "2": { verdict: "correct", score: 1, feedback: "..." },
 *     ...
 *   }
 * }
 */
router.post("/", async (req, res) => {
  const { questions, userAnswers } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "بيانات الأسئلة مفقودة أو غير صحيحة." });
  }

  if (!userAnswers || typeof userAnswers !== "object") {
    return res.status(400).json({ error: "بيانات الإجابات مفقودة." });
  }

  const hasShortAnswers = questions.some((q) => q.type === "shortanswer");
  if (!hasShortAnswers) {
    return res.status(200).json({ success: true, grades: {} });
  }

  try {
    const grades = await gradeAllShortAnswers(questions, userAnswers);
    return res.status(200).json({ success: true, grades });
  } catch (err) {
    console.error("[grade route]", err.message);
    return res.status(500).json({ error: err.message || "فشل تقييم الإجابات." });
  }
});

module.exports = router;
