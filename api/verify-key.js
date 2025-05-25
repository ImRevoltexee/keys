const keys = {};

export default function handler(req, res) {
  const { key } = req.query;
  const record = keys[key];

  if (record && Date.now() < record.expires) {
    res.status(200).json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
}
