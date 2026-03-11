// scripts/copy-build.js
// Copies client/dist → server/public after `vite build`
const fs   = require("fs");
const path = require("path");

const src  = path.resolve(__dirname, "../client/dist");
const dest = path.resolve(__dirname, "../server/public");

if (!fs.existsSync(src)) {
  console.error("❌  client/dist not found — did `vite build` succeed?");
  process.exit(1);
}

// Remove old public dir
if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });

// Copy recursively
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath  = path.join(from, entry.name);
    const destPath = path.join(to,   entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

copyDir(src, dest);
console.log("✅  client/dist  →  server/public");
