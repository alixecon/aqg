// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const uploadRoutes   = require("./routes/upload");
const generateRoutes = require("./routes/generate");
const gradeRoutes    = require("./routes/grade");

const app = express();
const PORT = process.env.PORT || 3001;

const IS_PROD    = process.env.NODE_ENV === "production";
const CLIENT_DIR = path.join(__dirname, "public"); // built React output

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Dev: allow Vite dev server. Prod: same origin (Express serves the SPA).
const corsOptions = IS_PROD
  ? { origin: process.env.ALLOWED_ORIGIN || true }
  : { origin: "http://localhost:5173" };
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Ensure uploads directory exists ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/upload",   uploadRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/grade",    gradeRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "الخادم يعمل بشكل صحيح", env: IS_PROD ? "production" : "development" });
});

// ─── Serve React SPA in production ───────────────────────────────────────────
if (IS_PROD) {
  if (fs.existsSync(CLIENT_DIR)) {
    app.use(express.static(CLIENT_DIR));
    // SPA fallback — all non-API routes return index.html
    app.get("*", (req, res) => {
      res.sendFile(path.join(CLIENT_DIR, "index.html"));
    });
  } else {
    console.warn("⚠️  server/public not found — run `npm run build` first");
  }
}

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(413).json({ error: "حجم الملف كبير جداً. الحد الأقصى المسموح به هو 20 ميغابايت." });
  if (err.code === "LIMIT_UNEXPECTED_FILE")
    return res.status(400).json({ error: "حقل الملف غير صحيح. يرجى إعادة المحاولة." });
  res.status(err.status || 500).json({
    error: err.message || "حدث خطأ غير متوقع في الخادم. يرجى المحاولة مرة أخرى.",
  });
});

// ─── 404 for unknown API routes ───────────────────────────────────────────────
app.use("/api", (req, res) => {
  res.status(404).json({ error: "المسار المطلوب غير موجود." });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على المنفذ ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/api/health`);
});
