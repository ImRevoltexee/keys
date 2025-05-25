import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});


export default async function handler(req, res) {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const uid = req.query.uid;

  if (!uid) return res.status(400).send("Missing UID");

  // Check if a key already exists for this IP
  const existingKey = await redis.get(`key:${ip}`);

  if (existingKey) {
    // Check TTL (time to live)
    const ttl = await redis.ttl(`key:${ip}`);
    if (ttl > 0) {
      return res.redirect(`/key.html?key=${existingKey}`);
    } else {
      // Key expired, delete it
      await redis.del(`key:${ip}`);
    }
  }

  // Generate a unique 24-char key
  const key =
    Math.random().toString(36).substring(2, 14) +
    Math.random().toString(36).substring(2, 14);

  // Store the key with IP, expire in 24 hours (86400 seconds)
  await redis.set(`key:${ip}`, key, { ex: 86400 });

  // Store reverse mapping for verification: key -> ip
  await redis.set(`ip:${key}`, ip, { ex: 86400 });

  // Redirect user to key page with the key in URL
  res.writeHead(302, {
    Location: `/key.html?key=${key}`,
  });
  res.end();
}
