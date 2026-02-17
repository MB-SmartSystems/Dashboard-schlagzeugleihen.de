const BASE = import.meta.env.VITE_BASEROW_URL;
const TOKEN = import.meta.env.VITE_BASEROW_TOKEN;

export async function fetchRows(tableId) {
  const res = await fetch(
    `${BASE}/api/database/rows/table/${tableId}/?user_field_names=true&size=200`,
    { headers: { Authorization: `Token ${TOKEN}` } }
  );
  if (!res.ok) throw new Error(`Baserow API Fehler ${res.status}`);
  return (await res.json()).results;
}

export async function triggerWebhook(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Webhook Fehler ${res.status}`);
  return res.json();
}

export const TABLE_IDS = {
  instrumente: 783,
  kunden: 784,
  mieten: 785,
  preismodelle: 786,
  angebote: 787,
  emailLog: 793,
  rechnungen: 834,
  belege: 835,
};
