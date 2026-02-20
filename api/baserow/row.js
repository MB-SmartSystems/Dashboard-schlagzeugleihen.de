import { requireAuth } from "../_lib/auth.js";
import { baserowFetch } from "../_lib/baserow.js";

const ALLOWED_TABLES = [783, 784, 785, 786, 787, 793, 834, 835, 852];

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAuth(req, res)) return;

  const { tableId, rowId, fields } = req.body || {};

  if (!ALLOWED_TABLES.includes(Number(tableId))) {
    return res.status(400).json({ error: "Ungültige Table-ID" });
  }

  let path, method;
  if (req.method === "POST") {
    path = `/api/database/rows/table/${tableId}/?user_field_names=true`;
    method = "POST";
  } else {
    const numericRowId = Number(rowId);
    if (!Number.isInteger(numericRowId) || numericRowId <= 0) {
      return res.status(400).json({ error: "Ungültige Row-ID" });
    }
    path = `/api/database/rows/table/${tableId}/${numericRowId}/?user_field_names=true`;
    method = "PATCH";
  }

  const apiRes = await baserowFetch(path, {
    method,
    body: JSON.stringify(fields),
  });

  const data = await apiRes.json();
  return res.status(apiRes.status).json(data);
}
