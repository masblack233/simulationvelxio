# ESP32 (Velxio) -> Vercel dashboard

Struktur:
- `api/ingest.js` menerima POST dari ESP32 (butuh header `x-api-key`)
- `api/latest.js` memberi 60 data terakhir ke dashboard
- `public/index.html` dashboard (polling tiap 3 detik)
- `esp32/sketch.ino` kode untuk Velxio

## 1. Deploy
```
npm install
npx vercel          # atau push ke GitHub lalu import di Vercel
```

## 2. Redis
Vercel dashboard -> Storage / Marketplace -> Upstash Redis -> hubungkan ke project.
Cek di Settings -> Environment Variables: harus ada `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
atau `KV_REST_API_URL` + `KV_REST_API_TOKEN` (kode ini menerima keduanya). Nama persisnya perlu Anda verifikasi.

## 3. API key
```
openssl rand -hex 24
```
Simpan sebagai env var `INGEST_API_KEY` di Vercel, lalu redeploy.

## 4. Tes tanpa Velxio
```
curl -i -X POST https://PROJECT.vercel.app/api/ingest \
  -H "content-type: application/json" -H "x-api-key: KEY_ANDA" \
  -d '{"device":"tes","temperature":26.5,"humidity":61}'
```
Harapan: 200. Tanpa key: 401. Buka `https://PROJECT.vercel.app` untuk melihat data.

## 5. Velxio
1. Board: ESP32 DevKit V1. Tempel `esp32/sketch.ino`, isi `URL` dan `API_KEY`.
2. Run, buka Serial monitor. Harapan: `POST {...} -> 200`.
3. Setelah jalan, tambahkan komponen DHT22: VCC ke 3V3, GND ke GND, data ke GPIO 4
   (cek label pin pada part-nya), pasang library DHT lewat Library Manager,
   lalu ubah `USE_FAKE_SENSOR` jadi 0.
4. Simpan proyek: menu File -> export .vlx.

## Keamanan
- `setInsecure()` hanya untuk simulasi.
- Jangan publikasikan proyek Velxio yang berisi API key produksi. Rotasi key setelah uji.
- `/api/latest` terbuka untuk umum. Tambahkan autentikasi jika datanya sensitif.
