// server/services/extractors/pdfExtractor.js
const pdfParse = require("pdf-parse");
const fs = require("fs");

/**
 * Extracts plain text from a PDF file.
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<string>} - Extracted plain text.
 */
async function extractFromPDF(filePath) {
  let dataBuffer;

  try {
    dataBuffer = fs.readFileSync(filePath);
  } catch (err) {
    throw new Error("تعذّر قراءة ملف PDF. تأكد من أن الملف غير تالف.");
  }

  let data;
  try {
    data = await pdfParse(dataBuffer);
  } catch (err) {
    console.error("[pdfExtractor] Parse error:", err.message);
    throw new Error(
      "فشل استخراج النص من ملف PDF. قد يكون الملف محمياً بكلمة مرور أو تالفاً."
    );
  }

  const text = data.text || "";

  if (text.trim().length < 50) {
    throw new Error(
      "لم يتم العثور على نص كافٍ في ملف PDF. قد يكون الملف يحتوي على صور فقط (Scanned PDF) وليس نصاً قابلاً للاستخراج."
    );
  }

  return text;
}

module.exports = { extractFromPDF };
