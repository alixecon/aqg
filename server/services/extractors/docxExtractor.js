// server/services/extractors/docxExtractor.js
const mammoth = require("mammoth");

/**
 * Extracts plain text from a DOCX file using mammoth.
 * @param {string} filePath - Absolute path to the DOCX file.
 * @returns {Promise<string>} - Extracted plain text.
 */
async function extractFromDOCX(filePath) {
  let result;

  try {
    result = await mammoth.extractRawText({ path: filePath });
  } catch (err) {
    console.error("[docxExtractor] Mammoth error:", err.message);
    throw new Error(
      "فشل استخراج النص من ملف DOCX. تأكد من أن الملف بصيغة .docx صحيحة وغير تالف."
    );
  }

  // Log any non-critical warnings from mammoth (e.g. unsupported features)
  if (result.messages && result.messages.length > 0) {
    result.messages.forEach((msg) => {
      if (msg.type === "error") {
        console.warn("[docxExtractor] Warning:", msg.message);
      }
    });
  }

  const text = result.value || "";

  if (text.trim().length < 50) {
    throw new Error(
      "لم يتم العثور على نص كافٍ في ملف DOCX. تأكد من أن الملف يحتوي على محتوى نصي."
    );
  }

  return text;
}

module.exports = { extractFromDOCX };
