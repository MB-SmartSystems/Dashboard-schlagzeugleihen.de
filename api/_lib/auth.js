import crypto from "crypto";

const COOKIE_NAME = "session";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${data}.${sig}`;
}

function verify(token) {
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  if (!data || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionCookie() {
  const now = Math.floor(Date.now() / 1000);
  const token = sign({ sub: "dashboard", iat: now, exp: now + MAX_AGE });
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function getSession(req) {
  const cookies = req.headers.cookie || "";
  const match = cookies
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const token = match.substring(COOKIE_NAME.length + 1);
  return verify(token);
}

export function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: "Nicht authentifiziert" });
    return false;
  }
  return true;
}
