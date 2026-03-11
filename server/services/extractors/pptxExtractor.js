// server/services/extractors/pptxExtractor.js
const officeParser = require("officeparser");

/**
 * Extracts plain text from a PPTX file using officeparser.
 * officeParser returns text via callback; we promisify it here.
 * @param {string} filePath - Absolute path to the PPTX file.
 * @returns {Promise<string>} - Extracted plain text.
 */
async function extractFromPPTX(filePath) {
  return new Promise((resolve, reject) => {
    officeParser.parseOffice(filePath, (text, err) => {
      if (err) {
        console.error("[pptxExtractor] officeParser error:", err);
        return reject(
          new Error(
            "فشل استخراج النص من ملف PPTX. تأكد من أن الملف بصيغة .pptx صحيحة وغير تالف."
          )
        );
      }

      const extracted = text || "";

      if (extracted.trim().length < 50) {
        return reject(
          new Error(
            "لم يتم العثور على نص كافٍ في ملف PPTX. قد تحتوي الشرائح على صور فقط دون نص."
          )
        );
      }

      resolve(extracted);
    });
  });
}

module.exports = { extractFromPPTX };
