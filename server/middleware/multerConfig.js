// server/middleware/multerConfig.js
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "20");

// ─── Allowed MIME types ───────────────────────────────────────────────────────
const ALLOWED_MIMETYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  // Some browsers may send these fallback types
  "application/octet-stream": null, // validated by extension below
};

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".pptx"];

// ─── Disk storage: unique filename, safe path ─────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(12).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload_${uniqueSuffix}${ext}`);
  },
});

// ─── File filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeAllowed = Object.keys(ALLOWED_MIMETYPES).includes(file.mimetype);
  const extAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeAllowed && extAllowed) {
    cb(null, true);
  } else if (!extAllowed) {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `نوع الملف غير مدعوم. يُرجى رفع ملف بصيغة: PDF أو DOCX أو PPTX فقط.`
      )
    );
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `نوع MIME للملف غير صحيح: ${file.mimetype}`
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

module.exports = upload;
