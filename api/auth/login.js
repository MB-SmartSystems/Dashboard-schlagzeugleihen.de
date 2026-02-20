import crypto from "crypto";
import { createSessionCookie } from "../_lib/auth.js";

// Simple per-instance rate limiting (resets on cold start, which is acceptable)
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    attempts.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Zu viele Versuche. Bitte später erneut versuchen." });
  }

  const { pin } = req.body || {};
  const expected = process.env.PIN || "";

  if (!pin || typeof pin !== "string" || !expected) {
    return res.status(401).json({ error: "Falscher PIN" });
  }

  // Timing-safe comparison
  const pinBuf = Buffer.from(String(pin));
  const expectedBuf = Buffer.from(expected);

  if (
    pinBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(pinBuf, expectedBuf)
  ) {
    return res.status(401).json({ error: "Falscher PIN" });
  }

  res.setHeader("Set-Cookie", createSessionCookie());
  return res.status(200).json({ ok: true });
}
