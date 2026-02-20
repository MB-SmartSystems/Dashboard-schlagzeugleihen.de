const { requireAuth } = require("../_lib/auth");

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAuth(req, res)) return;

  const webhookUrl = process.env.N8N_WEBHOOK_BELEG_UPLOAD;
  if (!webhookUrl) {
    return res.status(500).json({ error: "Upload nicht konfiguriert" });
  }

  // Validate content type
  const ct = req.headers["content-type"] || "";
  if (!ct.startsWith("multipart/form-data")) {
    return res.status(400).json({ error: "Nur multipart/form-data erlaubt" });
  }

  // Read raw body with size limit (10 MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  const chunks = [];
  let totalSize = 0;
  for await (const chunk of req) {
    totalSize += chunk.length;
    if (totalSize > MAX_SIZE) {
      return res.status(413).json({ error: "Datei zu groß (max 10 MB)" });
    }
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);

  const apiRes = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": req.headers["content-type"],
    },
    body,
  });

  const data = await apiRes.json();
  return res.status(apiRes.status).json(data);
}

module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
