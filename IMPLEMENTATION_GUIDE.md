# Panduan Implementasi Smart Parking System

Panduan ini berisi langkah-langkah teknis untuk mengimplementasikan proyek Smart Parking berbasis Computer Vision sesuai dengan rencana yang telah disusun.

## 1. Persiapan Struktur Proyek

Gunakan struktur folder berikut untuk memisahkan logika AI dan Dashboard:

```text
kelompok_iot/
├── ai_server/             # Pengolahan Citra & MQTT (Python)
├── web_dashboard/         # Dashboard Monitoring (Next.js)
├── rencana_proyek_...md   # Dokumentasi Rencana
└── IMPLEMENTATION_GUIDE.md # Panduan ini
```

---

## 2. Implementasi AI Server (Python & OpenCV)

### Langkah 1: Setup Lingkungan
1. Masuk ke folder `ai_server/`.
2. Buat virtual environment: `python -m venv venv`.
3. Aktifkan venv: `.\venv\Scripts\activate` (Windows).
4. Install dependensi:
   ```bash
   pip install opencv-python paho-mqtt numpy
   ```

### Langkah 2: Script Deteksi (`main.py`)
Script ini akan:
- Mengambil stream video dari IP Webcam.
- Menentukan ROI (Region of Interest) untuk slot parkir.
- Menghitung piksel putih (thresholding).
- Mengirim status ke MQTT Broker.

---

## 3. Implementasi Web Dashboard (Next.js)

### Langkah 1: Inisialisasi Project
1. Gunakan `create-next-app` untuk membuat dashboard:
   ```bash
   npx create-next-app@latest web_dashboard --typescript --tailwind --eslint
   ```
2. Pilih opsi default (App Router, src directory, dll).

### Langkah 2: Install Library MQTT
```bash
npm install mqtt
```

### Langkah 3: Koneksi & UI
- Buat komponen `ParkingGrid` yang berlangganan ke topik MQTT.
- Gunakan Tailwind CSS untuk styling (Hijau = Kosong, Merah = Terisi).

---

## 4. Cara Menjalankan Sistem

1. **Jalankan IP Webcam** di Smartphone dan catat URL-nya (misal: `http://192.168.1.10:8080/video`).
2. **Jalankan Python Script**:
   ```bash
   cd ai_server
   python main.py
   ```
3. **Jalankan Web Dashboard**:
   ```bash
   cd web_dashboard
   npm run dev
   ```
4. Pantau perubahan status pada dashboard saat objek diletakkan di area parkir maket.
