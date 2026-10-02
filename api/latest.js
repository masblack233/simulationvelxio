const redis = require('../lib/redis');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });
  const readings = await redis.lrange('readings', 0, 59); // terbaru lebih dulu
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ readings, serverTime: Date.now() });
};
