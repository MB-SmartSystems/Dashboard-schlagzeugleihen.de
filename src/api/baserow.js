async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "same-origin",
  });
  if (res.status === 401) {
    window.dispatchEvent(new Event("session-expired"));
    throw new Error("Sitzung abgelaufen");
  }
  return res;
}

export async function fetchRows(tableId) {
  const res = await apiFetch(`/api/baserow/rows?tableId=${tableId}&size=200`);
  if (!res.ok) throw new Error(`API Fehler ${res.status}`);
  return (await res.json()).results;
}

export async function updateRow(tableId, rowId, fields) {
  const res = await apiFetch("/api/baserow/row", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableId, rowId, fields }),
  });
  if (!res.ok) throw new Error(`PATCH Fehler ${res.status}`);
  return res.json();
}

export async function createRow(tableId, fields) {
  const res = await apiFetch("/api/baserow/row", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableId, fields }),
  });
  if (!res.ok) throw new Error(`POST Fehler ${res.status}`);
  return res.json();
}

export async function triggerWebhook(webhookName, payload) {
  const res = await apiFetch("/api/webhook/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ webhook: webhookName, payload }),
  });
  if (!res.ok) throw new Error(`Webhook Fehler ${res.status}`);
  return res.json();
}

export async function uploadBeleg(formData) {
  const res = await apiFetch("/api/upload/beleg", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload Fehler ${res.status}`);
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
  aufgaben: 852,
};
