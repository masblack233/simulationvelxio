const crypto = require('crypto');
const getRedis = require('../lib/redis');

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  const key = process.env.INGEST_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'INGEST_API_KEY belum diset' });
  if (!safeEqual(req.headers['x-api-key'], key)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch { b = null; }
  }
  const t = b?.temperature;
  const h = b?.humidity;
  const device = String(b?.device ?? 'esp32').slice(0, 32);
  const valid =
    typeof t === 'number' && typeof h === 'number' &&
    Number.isFinite(t) && Number.isFinite(h) &&
    t >= -40 && t <= 80 && h >= 0 && h <= 100 &&
    /^[\w-]+$/.test(device);
  if (!valid) return res.status(400).json({ ok: false, error: 'payload tidak valid' });

  try {
    const redis = getRedis();
    // Batas kasar: 60 request/menit untuk seluruh endpoint
    const bucket = `rl:${Math.floor(Date.now() / 60000)}`;
    const n = await redis.incr(bucket);
    if (n === 1) await redis.expire(bucket, 90);
    if (n > 60) return res.status(429).json({ ok: false, error: 'terlalu sering' });

    // Timestamp dari server, bukan dari jam emulator
    await redis.lpush('readings', { device, temperature: t, humidity: h, ts: Date.now() });
    await redis.ltrim('readings', 0, 199);

  } catch (e) {
    console.error('ingest error:', e);
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }

  return res.status(200).json({ ok: true });
};
