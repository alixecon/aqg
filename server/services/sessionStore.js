// server/services/sessionStore.js
//
// Lightweight in-memory key→value store for extracted text.
// Replaces the pattern of sending full text back to the client
// and re-receiving it on /api/generate.
//
// Each session expires after TTL_MS of inactivity (default: 30 min).
// A cleanup sweep runs every 5 minutes to evict expired entries.

const crypto = require("crypto");

const TTL_MS      = 30 * 60 * 1000; // 30 minutes
const SWEEP_MS    =  5 * 60 * 1000; // sweep every 5 min
const MAX_ENTRIES = 200;             // hard cap — oldest evicted first

const store = new Map(); // sessionId → { text, fileName, charCount, expiresAt }

// ─── Sweep expired entries ────────────────────────────────────────────────────
function sweep() {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(id);
  }
}
setInterval(sweep, SWEEP_MS).unref(); // .unref() so it doesn't block process exit

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Store extracted text and return a short session ID.
 * @param {string} text
 * @param {string} fileName
 * @returns {string} sessionId  (hex, 24 chars)
 */
function createSession(text, fileName) {
  // Evict oldest if at cap
  if (store.size >= MAX_ENTRIES) {
    const oldest = [...store.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
    if (oldest) store.delete(oldest[0]);
  }

  const sessionId = crypto.randomBytes(12).toString("hex");
  store.set(sessionId, {
    text,
    fileName,
    charCount: text.length,
    preview: text.slice(0, 400).trim(),   // first 400 chars for client preview
    expiresAt: Date.now() + TTL_MS,
  });

  return sessionId;
}

/**
 * Retrieve a session by ID. Refreshes TTL on access.
 * Returns null if not found or expired.
 * @param {string} sessionId
 * @returns {{ text, fileName, charCount, preview } | null}
 */
function getSession(sessionId) {
  const entry = store.get(sessionId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(sessionId);
    return null;
  }
  // Refresh TTL
  entry.expiresAt = Date.now() + TTL_MS;
  return entry;
}

/**
 * Explicitly delete a session (e.g. after quiz is generated).
 * @param {string} sessionId
 */
function deleteSession(sessionId) {
  store.delete(sessionId);
}

module.exports = { createSession, getSession, deleteSession };
