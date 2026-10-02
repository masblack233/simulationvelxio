const redis = require('../lib/redis');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });
  try {
    const readings = await redis.lrange('readings', 0, 59); // terbaru lebih dulu
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ readings, serverTime: Date.now() });
  } catch (e) {
    console.error('latest error:', e);
    const hasUrl = !!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);
    const hasToken = !!(process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN);
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200), hasUrl, hasToken });
  }
};
