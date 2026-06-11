# 🅿️ Smart Parking System — Garis Awan

Sistem parkir pintar berbasis **Computer Vision (AIoT)** untuk memantau ketersediaan 6 slot parkir secara *real-time* menggunakan ESP32-CAM, ESP32 DevKit V1, dan Web Dashboard Next.js.

## Arsitektur Sistem

```text
[ ESP32-CAM (OV2640) ]
         | (Wireless Video Stream / MJPEG)
         v
[ Laptop / Edge Server (Python + OpenCV) ]
         | (Protokol MQTT - JSON Payload)
         v
[ Cloud MQTT Broker (HiveMQ) ]
        / \
       /   \
      v     v
[ Web Dashboard ]   [ ESP32 DevKit V1 ]
[ Next.js + Charts] [ 6 LED + LCD I2C ]
```

## Struktur Proyek

```text
kelompok_iot/
├── ai_server/              # Pengolahan Citra & MQTT (Python)
│   ├── main.py             # Deteksi 6 slot (Manual ROI)
│   ├── main_requests.py    # Deteksi 6 slot (Auto Kalibrasi)
│   ├── requirements.txt    # Dependensi Python
│   └── test_kamera.py      # Tes koneksi kamera
├── esp32_firmware/          # Firmware ESP32 DevKit V1
│   ├── sketch.ino          # Kode C++ (6 LED + LCD I2C)
│   ├── diagram.json        # Konfigurasi Wokwi Simulator
│   └── libraries.txt       # Library Arduino
├── web_dashboard/           # Dashboard Monitoring (Next.js)
│   └── src/app/
│       ├── page.tsx         # Dashboard utama (6 slot)
│       ├── analytics/       # Halaman analytics
│       ├── api/parking/     # API endpoint data historis
│       └── components/      # Komponen UI
├── PRD.md                   # Product Requirements Document
├── GUIDE_MAKET.md          # Panduan pembuatan maket
└── README.md               # Dokumen ini
```

## Persiapan

Pastikan **ESP32-CAM** dan **Laptop** berada dalam **jaringan Wi-Fi yang sama**.

### 1. Menjalankan AI Server (Python)

```bash
cd ai_server
python -m venv venv
.\venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Buka `main_requests.py` dan ganti `URL` dengan IP stream ESP32-CAM Anda:
```python
URL = "http://192.168.1.100:81/stream"
```

Jalankan skrip deteksi:
```bash
python main_requests.py        # Mode auto-kalibrasi (rekomendasi)
# atau
python main.py                 # Mode manual ROI
```

### 2. Menjalankan Web Dashboard (Next.js)

```bash
cd web_dashboard
npm install
npm run dev
```

Buka `http://localhost:3000` di browser Anda.

### 3. Upload Firmware ESP32 (Arduino IDE / Wokwi)

**Opsi A — Wokwi Simulator:**
1. Buka [wokwi.com](https://wokwi.com)
2. Buat project baru ESP32
3. Paste isi `esp32_firmware/sketch.ino`
4. Paste isi `esp32_firmware/diagram.json` ke tab diagram
5. Jalankan simulasi

**Opsi B — Hardware Fisik:**
1. Buka Arduino IDE
2. Install library: `PubSubClient`, `LiquidCrystal I2C`, `ArduinoJson`
3. Buka `esp32_firmware/sketch.ino`
4. Ganti `ssid` dan `password` dengan kredensial Wi-Fi Anda
5. Upload ke ESP32 DevKit V1

### Pinout Mapping (ESP32 DevKit V1)

| Komponen | Pin ESP32 |
|----------|-----------|
| LCD SDA  | GPIO 21   |
| LCD SCL  | GPIO 22   |
| LED Slot 1 | GPIO 13 |
| LED Slot 2 | GPIO 12 |
| LED Slot 3 | GPIO 14 |
| LED Slot 4 | GPIO 27 |
| LED Slot 5 | GPIO 26 |
| LED Slot 6 | GPIO 25 |

## Pengoperasian

- **Dashboard**: Pantau status slot di `http://localhost:3000`
- **Analytics**: Lihat insight data di `http://localhost:3000/analytics`
- **Kalibrasi Ulang**: Tekan `r` pada jendela preview AI Server
- **Berhenti**: Tekan `q` pada jendela preview AI Server

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Kamera tidak terhubung | Pastikan ESP32-CAM dan laptop di Wi-Fi yang sama. Coba buka URL stream di browser. |
| MQTT tidak terkirim | Cek koneksi internet. Broker `broker.hivemq.com` harus bisa diakses. |
| LED tidak menyala di Wokwi | Pastikan topik MQTT sama: `garisawan/parking/display` |
| Dashboard tidak update | Buka console browser (F12) dan cek error MQTT. |
| Slot selalu merah | Naikkan `PIXEL_THRESHOLD` di `main_requests.py` |
| Slot selalu hijau | Turunkan `PIXEL_THRESHOLD` di `main_requests.py` |

## Tech Stack

- **Computer Vision**: Python 3.x, OpenCV, NumPy
- **IoT Protocol**: MQTT (paho-mqtt, mqtt.js, PubSubClient)
- **Cloud Broker**: HiveMQ (broker.hivemq.com)
- **Mikrokontroler**: ESP32 DevKit V1, ESP32-CAM (OV2640)
- **Web Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Display**: LCD 1602 I2C, 6x LED Merah + Resistor 330Ω
