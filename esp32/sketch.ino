// ESP32 -> Vercel (HTTPS POST). Dijalankan di Velxio (ESP32 DevKit V1).
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// 1 = data palsu (uji jaringan dulu). 0 = baca DHT22 sungguhan.
#define USE_FAKE_SENSOR 1

#if !USE_FAKE_SENSOR
  #include <DHT.h>
  #define DHT_PIN 4
  DHT dht(DHT_PIN, DHT22);
#endif

// === GANTI ===
const char* URL     = "https://GANTI-PROJECT.vercel.app/api/ingest";
const char* API_KEY = "GANTI-DENGAN-KEY-UJI";   // jangan pakai key produksi di proyek Velxio yang dipublikasikan
const char* DEVICE  = "esp32-sim-1";
// =============

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin("Velxio-GUEST");   // SSID di sini ditulis ulang compiler Velxio; tidak berpengaruh
  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(250); Serial.print("."); }
  Serial.printf("\nIP: %s\n", WiFi.localIP().toString().c_str());
}

void setup() {
  Serial.begin(115200);
#if !USE_FAKE_SENSOR
  dht.begin();
#endif
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

#if USE_FAKE_SENSOR
  float t = 27.0 + 3.0 * sin(millis() / 20000.0);
  float h = 60.0 + 10.0 * cos(millis() / 30000.0);
#else
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) { Serial.println("Sensor gagal dibaca"); delay(2000); return; }
#endif

  char body[128];
  snprintf(body, sizeof(body),
           "{\"device\":\"%s\",\"temperature\":%.1f,\"humidity\":%.1f}", DEVICE, t, h);

  WiFiClientSecure client;
  client.setInsecure();          // HANYA untuk simulasi: sertifikat tidak divalidasi
  HTTPClient http;
  http.setTimeout(20000);        // handshake TLS di emulator lambat
  if (http.begin(client, URL)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", API_KEY);
    int code = http.POST(body);
    Serial.printf("POST %s -> %d\n", body, code);
    if (code < 0) Serial.println(http.errorToString(code));
    http.end();
  }
  delay(10000);                  // jangan terlalu rapat
}
