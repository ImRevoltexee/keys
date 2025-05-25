const keys = {};

export default function handler(req, res) {
  const { uid } = req.query;

  if (!uid) return res.status(400).json({ error: "Missing UID" });

  const key = [...Array(24)].map(() => Math.random().toString(36)[2]).join('').toUpperCase();
  const expires = Date.now() + 24 * 60 * 60 * 1000;

  keys[key] = { uid, expires };

  res.status(200).json({ key, expires });
}
