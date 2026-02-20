const { getSession } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: "Nicht authentifiziert" });
  }

  return res.status(200).json({ authenticated: true });
};
