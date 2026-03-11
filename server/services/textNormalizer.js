// server/services/textNormalizer.js

/**
 * Normalizes extracted raw text before sending to the AI.
 * Handles issues common in PDF/DOCX/PPTX extractions such as:
 *  - Excessive blank lines
 *  - Ligature artifacts
 *  - Soft hyphens and zero-width characters
 *  - Page headers/footers (page numbers, repeated titles)
 *  - Truncation to a safe token limit
 */

const MAX_CHARS = 15000; // ~4000 tokens — safe budget for claude-sonnet

/**
 * Remove invisible/problematic Unicode characters.
 */
function removeInvisibleChars(text) {
  return text
    .replace(/\u00AD/g, "")   // soft hyphen
    .replace(/\u200B/g, "")   // zero-width space
    .replace(/\u200C/g, "")   // zero-width non-joiner
    .replace(/\u200D/g, "")   // zero-width joiner
    .replace(/\uFEFF/g, "")   // BOM / zero-width no-break space
    .replace(/\u00A0/g, " ")  // non-breaking space → regular space
    .replace(/\t/g, " ");     // tabs → space
}

/**
 * Collapse multiple whitespace/blank lines into at most two newlines.
 */
function collapseWhitespace(text) {
  return text
    .replace(/[ \t]+/g, " ")         // collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n")       // collapse excessive blank lines
    .trim();
}

/**
 * Remove common page-number patterns like "Page 1", "- 2 -", "١٢", lone digits on their own line.
 */
function removePageNumbers(text) {
  return text
    .replace(/^[\-–—]?\s*\d+\s*[\-–—]?$/gm, "")    // "- 3 -" or "3"
    .replace(/^صفحة\s*\d+$/gm, "")                   // Arabic "صفحة 3"
    .replace(/^Page\s*\d+$/gim, "")                  // English "Page 3"
    .replace(/^\d+\s*\/\s*\d+$/gm, "");              // "3/20"
}

/**
 * Deduplicate repeated header/footer lines that appear on every page.
 * Strategy: count line frequency; if a line appears >3 times, remove it.
 */
function removeRepeatedLines(text) {
  const lines = text.split("\n");
  const freq = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 3) {
      freq[trimmed] = (freq[trimmed] || 0) + 1;
    }
  }

  return lines
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed.length <= 3 || freq[trimmed] <= 3;
    })
    .join("\n");
}

/**
 * Truncate text to MAX_CHARS, breaking at the nearest sentence boundary.
 * Adds a note in Arabic if truncated.
 */
function truncate(text) {
  if (text.length <= MAX_CHARS) return text;

  const slice = text.slice(0, MAX_CHARS);
  // Find last sentence-ending punctuation
  const lastBreak = Math.max(
    slice.lastIndexOf("۔"),
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?"),
    slice.lastIndexOf("؟"),
    slice.lastIndexOf("،")
  );

  const cutPoint = lastBreak > MAX_CHARS * 0.8 ? lastBreak + 1 : MAX_CHARS;

  console.warn(
    `[textNormalizer] Text truncated from ${text.length} to ${cutPoint} chars`
  );

  return (
    text.slice(0, cutPoint).trim() +
    "\n\n[ملاحظة: تم اقتطاع بقية النص لتجاوزه الحد المسموح به، وتم توليد الأسئلة من الجزء المستخرج أعلاه.]"
  );
}

/**
 * Main normalizer — runs all cleanup steps in order.
 * @param {string} rawText
 * @returns {string} cleanText
 */
function normalizeText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("النص المستخرج فارغ أو غير صالح للمعالجة.");
  }

  let text = rawText;
  text = removeInvisibleChars(text);
  text = removePageNumbers(text);
  text = removeRepeatedLines(text);
  text = collapseWhitespace(text);
  text = truncate(text);

  if (text.trim().length < 50) {
    throw new Error(
      "النص المستخرج قصير جداً بعد التنظيف. لا يمكن توليد أسئلة من هذا المحتوى."
    );
  }

  return text;
}

module.exports = { normalizeText };
