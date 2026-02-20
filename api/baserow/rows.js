const { requireAuth } = require("../_lib/auth");
const { baserowFetch } = require("../_lib/baserow");

const ALLOWED_TABLES = [783, 784, 785, 786, 787, 793, 834, 835, 852];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAuth(req, res)) return;

  const tableId = Number(req.query.tableId);
  const size = Math.min(Math.max(Number(req.query.size) || 200, 1), 500);

  if (!ALLOWED_TABLES.includes(tableId)) {
    return res.status(400).json({ error: "Ungültige Table-ID" });
  }

  const apiRes = await baserowFetch(
    `/api/database/rows/table/${tableId}/?user_field_names=true&size=${size}`
  );

  const data = await apiRes.json();
  return res.status(apiRes.status).json(data);
};
