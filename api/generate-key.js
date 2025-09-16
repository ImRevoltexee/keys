import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Token API cuty.io
const CUTY_TOKEN = "87a312eb6315f7c057f011979";

export default async function handler(req, res) {
  const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress;
  const uid = req.query.uid;
  const duration = req.query.duration === "12" ? 43200 : 86400; // 12h or 24h

  if (!uid) return res.status(400).send("Missing UID");

  // Cek apakah IP sudah punya key
  const existingKey = await redis.get(`key:${ip}`);
  if (existingKey) {
    const ttl = await redis.ttl(`key:${ip}`);
    if (ttl > 0) {
      return res.redirect(`/key.html?key=${existingKey}`);
    } else {
      await redis.del(`key:${ip}`);
    }
  }

  // Generate key random 24 karakter
  const key =
    Math.random().toString(36).substring(2, 14) +
    Math.random().toString(36).substring(2, 14);

  // Simpan di Redis
  await redis.set(`key:${ip}`, key, { ex: duration });
  await redis.set(`ip:${key}`, ip, { ex: duration });

  // URL tujuan setelah shortlink
  const longUrl = `https://${req.headers.host}/key.html?key=${key}`;

  // Panggil cuty.io API
  try {
    const cutyRes = await fetch("https://api.cuty.io/full", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: CUTY_TOKEN,
        url: longUrl,
        title: `Key for ${uid}`,
      }),
    });

    const cutyData = await cutyRes.json();

    if (cutyData?.data?.short_url) {
      return res.writeHead(302, { Location: cutyData.data.short_url }).end();
    } else {
      console.error("cuty.io error:", cutyData);
      return res.redirect(longUrl); // fallback
    }
  } catch (err) {
    console.error("cuty.io fetch failed:", err);
    return res.redirect(longUrl); // fallback
  }
}
