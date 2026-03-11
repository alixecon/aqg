import mammoth from "mammoth";
import JSZip from "jszip";

// ---------------------------------------------------------------------------
// PDF extraction
// ---------------------------------------------------------------------------
export async function extractFromPDF(buffer: Buffer): Promise<string> {
  // Dynamic import avoids the pdf-parse startup test-file issue in Next.js
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return cleanText(data.text);
}

// ---------------------------------------------------------------------------
// DOCX extraction using mammoth
// ---------------------------------------------------------------------------
export async function extractFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  if (result.messages.length > 0) {
    // Log warnings but don't fail
    result.messages.forEach((m) => console.warn("mammoth:", m.message));
  }
  return cleanText(result.value);
}

// ---------------------------------------------------------------------------
// PPTX extraction – a PPTX is just a ZIP containing XML files.
// Each slide lives at ppt/slides/slide{N}.xml.
// We walk all slide XMLs and pull text from <a:t> elements.
// ---------------------------------------------------------------------------
export async function extractFromPPTX(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideTexts: string[] = [];

  // Collect slide filenames sorted by slide number
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
      const numB = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
      return numA - numB;
    });

  for (const slideName of slideFiles) {
    const xml = await zip.files[slideName].async("text");
    // Extract all <a:t> text nodes
    const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? [];
    const text = matches
      .map((tag) => tag.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .join(" ");

    if (text.trim()) {
      slideTexts.push(text.trim());
    }
  }

  return cleanText(slideTexts.join("\n\n"));
}

// ---------------------------------------------------------------------------
// Route dispatcher – choose extractor by MIME / extension
// ---------------------------------------------------------------------------
export async function extractText(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (
    mimeType === "application/pdf" ||
    mimeType === "application/x-pdf" ||
    ext === "pdf"
  ) {
    return extractFromPDF(buffer);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    ext === "docx" ||
    ext === "doc"
  ) {
    return extractFromDOCX(buffer);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    ext === "pptx" ||
    ext === "ppt"
  ) {
    return extractFromPPTX(buffer);
  }

  throw new Error(
    `نوع الملف غير مدعوم. الأنواع المدعومة هي: PDF، DOCX، PPTX`
  );
}

// ---------------------------------------------------------------------------
// Text normalization helpers
// ---------------------------------------------------------------------------
function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Collapse 3+ blank lines into 2
    .replace(/\n{3,}/g, "\n\n")
    // Remove non-printable characters except whitespace
    .replace(/[^\S\n]+/g, " ")
    // Trim each line
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}
