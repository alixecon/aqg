// server/routes/upload.js
const express = require("express");
const router  = express.Router();
const path    = require("path");
const fs      = require("fs");

const upload        = require("../middleware/multerConfig");
const { extractFromPDF }  = require("../services/extractors/pdfExtractor");
const { extractFromDOCX } = require("../services/extractors/docxExtractor");
const { extractFromPPTX } = require("../services/extractors/pptxExtractor");
const { normalizeText }   = require("../services/textNormalizer");
const { createSession }   = require("../services/sessionStore");

function cleanupFile(filePath) {
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }
  catch (err) { console.warn("[upload] cleanup failed:", err.message); }
}

async function extractText(filePath, extension) {
  switch (extension) {
    case ".pdf":  return await extractFromPDF(filePath);
    case ".docx": return await extractFromDOCX(filePath);
    case ".pptx": return await extractFromPPTX(filePath);
    default: throw new Error(`نوع الملف "${extension}" غير مدعوم.`);
  }
}

/**
 * Estimate page count from character count.
 * Arabic text averages ~1800–2200 chars/page (A4, normal font).
 * We use 2000 as a balanced middle ground.
 */
function estimatePageCount(charCount) {
  return Math.max(1, Math.ceil(charCount / 2000));
}

// POST /api/upload
// Returns sessionId + preview + estimated pageCount
router.post(
  "/",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || "خطأ في رفع الملف." });
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "لم يتم استقبال أي ملف." });
    }

    const filePath    = req.file.path;
    const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
    const extension   = path.extname(originalName).toLowerCase();

    try {
      const rawText   = await extractText(filePath, extension);
      const cleanText = normalizeText(rawText);
      cleanupFile(filePath);

      const sessionId = createSession(cleanText, originalName);
      const pageCount = estimatePageCount(cleanText.length);

      return res.status(200).json({
        success:   true,
        sessionId,
        fileName:  originalName,
        fileType:  extension,
        charCount: cleanText.length,
        pageCount,
        preview:   cleanText.slice(0, 400).trimEnd() + (cleanText.length > 400 ? "…" : ""),
      });
    } catch (err) {
      cleanupFile(filePath);
      console.error("[upload route]", err.message);

      const isScanned = err.message.includes("قصير جداً") || err.message.includes("كافٍ");
      const errorMsg  = isScanned
        ? "لم يُعثَر على نص في الملف. إذا كان ملفك ممسوحاً ضوئياً (Scanned PDF)، حوّله أولاً إلى PDF نصي عبر Adobe Acrobat أو Google Drive."
        : err.message || "فشل استخراج النص من الملف.";

      return res.status(422).json({ error: errorMsg });
    }
  }
);

module.exports = router;