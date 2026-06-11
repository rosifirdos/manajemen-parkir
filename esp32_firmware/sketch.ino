#include <WiFi.h>
#include <PubSubClient.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// =============================================================
// SMART PARKING SYSTEM - ESP32 Local Display Controller
// Firmware untuk ESP32 DevKit V1 (6 LED + LCD 1602 I2C)
// Sesuai PRD Pinout Mapping:
//   LED Slot 1 = GPIO 13 | LED Slot 2 = GPIO 12
//   LED Slot 3 = GPIO 14 | LED Slot 4 = GPIO 27
//   LED Slot 5 = GPIO 26 | LED Slot 6 = GPIO 25
//   LCD SDA    = GPIO 21 | LCD SCL    = GPIO 22
// =============================================================

// --- Konfigurasi Jaringan & MQTT ---
const char* ssid = "Wokwi-GUEST";       // Ganti dengan SSID Wi-Fi Anda
const char* password = "";               // Ganti dengan password Wi-Fi Anda
const char* mqtt_server = "broker.hivemq.com";
const int   mqtt_port = 1883;
// Topik MQTT harus sama dengan yang dikirim oleh AI Server Python
const char* mqtt_topic = "garisawan/parking/display";

// --- Inisialisasi Objek ---
WiFiClient espClient;
PubSubClient client(espClient);
LiquidCrystal_I2C lcd(0x27, 16, 2);  // Alamat I2C 0x27, 16 kolom x 2 baris

// --- Pin LED Indikator (sesuai PRD Section 5) ---
const int NUM_SLOTS = 6;
const int ledPins[NUM_SLOTS] = {13, 12, 14, 27, 26, 25};

// Status slot (untuk tracking perubahan)
int slotStatus[NUM_SLOTS] = {0, 0, 0, 0, 0, 0};
int availableSlots = NUM_SLOTS;

// --- Fungsi Setup Wi-Fi ---
void setup_wifi() {
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  lcd.setCursor(0, 1);
  lcd.print("...");
  
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int dots = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    dots++;
    lcd.setCursor(dots % 16, 1);
    lcd.print(".");
  }
  
  Serial.println();
  Serial.print("WiFi Terhubung! IP: ");
  Serial.println(WiFi.localIP());
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected!");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP());
  delay(2000);
}

// --- Fungsi Update Display LCD ---
void updateLCD() {
  lcd.clear();
  
  // Baris 1: Jumlah slot kosong
  lcd.setCursor(0, 0);
  lcd.print("Slot Kosong: ");
  lcd.print(availableSlots);
  
  // Baris 2: Status visual 6 slot
  // Format: [X][ ][X][ ][X][ ]  (X = terisi, spasi = kosong)
  lcd.setCursor(0, 1);
  for (int i = 0; i < NUM_SLOTS; i++) {
    if (slotStatus[i]) {
      lcd.print("[X]");
    } else {
      lcd.print("[ ]");
    }
    // Tidak ada separator karena 6x[X] = 18 karakter, sudah melebihi 16
    // Jadi gunakan format tanpa bracket yang lebih compact
  }
}

// --- Fungsi Update Display LCD (Compact Mode) ---
void updateLCDCompact() {
  lcd.clear();
  
  // Baris 1: Jumlah slot kosong + total
  lcd.setCursor(0, 0);
  lcd.print("Kosong:");
  lcd.print(availableSlots);
  lcd.print("/");
  lcd.print(NUM_SLOTS);
  lcd.print(" slot");
  
  // Baris 2: Status visual 6 slot (compact)
  // Format: 1:X 2:O 3:X 4:O 5:X 6:O
  lcd.setCursor(0, 1);
  for (int i = 0; i < NUM_SLOTS; i++) {
    lcd.print(i + 1);
    lcd.print(slotStatus[i] ? "X" : "O");
    if (i < NUM_SLOTS - 1) lcd.print(" ");
  }
}

// --- Fungsi Callback MQTT (Penerima Pesan dari AI Server) ---
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("📥 Pesan Masuk (JSON): " + message);

  // Parsing JSON (Disesuaikan dengan payload dari main.py / main_requests.py)
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("❌ Gagal parsing JSON: ");
    Serial.println(error.c_str());
    return;
  }

  // Baca status setiap slot dari payload
  bool statusChanged = false;
  for (int i = 0; i < NUM_SLOTS; i++) {
    String key = "slot_" + String(i + 1);
    if (doc.containsKey(key)) {
      int newStatus = doc[key];
      if (slotStatus[i] != newStatus) {
        statusChanged = true;
      }
      slotStatus[i] = newStatus;
    }
  }

  // Baca jumlah slot tersedia
  if (doc.containsKey("available_slots")) {
    availableSlots = doc["available_slots"];
  } else if (doc.containsKey("available")) {
    availableSlots = doc["available"];
  }

  // Update LED hanya jika ada perubahan
  if (statusChanged) {
    for (int i = 0; i < NUM_SLOTS; i++) {
      digitalWrite(ledPins[i], slotStatus[i] == 1 ? HIGH : LOW);
      Serial.print("  LED Slot ");
      Serial.print(i + 1);
      Serial.print(" (GPIO ");
      Serial.print(ledPins[i]);
      Serial.print("): ");
      Serial.println(slotStatus[i] ? "ON (Terisi)" : "OFF (Kosong)");
    }
  }

  // Update LCD
  updateLCDCompact();

  Serial.print("📊 Status: ");
  Serial.print(availableSlots);
  Serial.print("/");
  Serial.print(NUM_SLOTS);
  Serial.println(" slot tersedia");
}

// --- Fungsi Reconnect MQTT ---
void reconnect() {
  while (!client.connected()) {
    Serial.print("🔄 Menghubungkan ke MQTT...");
    
    // Buat client ID unik
    String clientId = "ESP32Display-" + String(random(0, 0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println(" Terhubung!");
      // Subscribe ke topik untuk menerima data dari AI Server
      client.subscribe(mqtt_topic);
      Serial.print("📡 Subscribed ke: ");
      Serial.println(mqtt_topic);
      
      // Tampilkan status siap di LCD
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("MQTT Connected!");
      lcd.setCursor(0, 1);
      lcd.print("Menunggu data...");
    } else {
      Serial.print("❌ Gagal, status=");
      Serial.print(client.state());
      Serial.println(" Coba lagi 5 detik");
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("MQTT Error!");
      lcd.setCursor(0, 1);
      lcd.print("Reconnecting...");
      
      delay(5000);
    }
  }
}

// --- Setup Utama ---
void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("====================================");
  Serial.println("  SMART PARKING - Display Controller");
  Serial.println("  6 LED + LCD I2C (ESP32 DevKit V1)");
  Serial.println("====================================");

  // Setup pin LED sebagai OUTPUT
  for (int i = 0; i < NUM_SLOTS; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);  // Matikan semua LED saat boot
  }

  // Inisialisasi LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Parking");
  lcd.setCursor(0, 1);
  lcd.print("Booting...");
  delay(1000);

  // Koneksi Wi-Fi
  setup_wifi();

  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  // LED startup animation (berurutan menyala lalu mati)
  Serial.println("💡 LED Test Animation...");
  for (int i = 0; i < NUM_SLOTS; i++) {
    digitalWrite(ledPins[i], HIGH);
    delay(150);
  }
  delay(500);
  for (int i = NUM_SLOTS - 1; i >= 0; i--) {
    digitalWrite(ledPins[i], LOW);
    delay(150);
  }
  
  Serial.println("✅ Setup selesai. Menunggu data MQTT...");
}

// --- Loop Utama ---
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
