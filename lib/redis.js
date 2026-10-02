let client;

// Dibuat saat pertama dipakai (bukan saat file dimuat), supaya error
// modul/env tampil sebagai respons JSON yang bisa dibaca, bukan crash kosong.
module.exports = () => {
  if (!client) {
    const { Redis } = require('@upstash/redis');
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
    });
  }
  return client;
};
