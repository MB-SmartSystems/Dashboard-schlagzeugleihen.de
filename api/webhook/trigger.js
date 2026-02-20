import { requireAuth } from "../_lib/auth.js";

const WEBHOOK_MAP = {
  angebot_erstellen: () => process.env.N8N_WEBHOOK_ANGEBOT_ERSTELLEN,
  angebot_ablehnen: () => process.env.N8N_WEBHOOK_ANGEBOT_ABLEHNEN,
  beleg_analyse: () => process.env.N8N_WEBHOOK_BELEG_ANALYSE,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAuth(req, res)) return;

  const { webhook, payload } = req.body || {};

  const getUrl = WEBHOOK_MAP[webhook];
  if (!getUrl) {
    return res.status(400).json({ error: "Unbekannter Webhook" });
  }

  const url = getUrl();
  if (!url) {
    return res.status(400).json({ error: "Webhook nicht konfiguriert" });
  }

  const apiRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await apiRes.json();
  return res.status(apiRes.status).json(data);
}
