import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});


export default async function handler(req, res) {
  const key = req.query.key;
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  if (!key) return res.status(400).json({ valid: false, reason: "Missing key" });

  // Find IP associated with this key
  const storedIp = await redis.get(`ip:${key}`);

  if (!storedIp) {
    return res.status(404).json({ valid: false, reason: "Key not found or expired" });
  }

  if (storedIp !== ip) {
    return res.status(403).json({ valid: false, reason: "Key not valid for this IP" });
  }

  // Key is valid for this IP
  return res.status(200).json({ valid: true });
}
