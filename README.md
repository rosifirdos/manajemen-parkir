# Smart Parking System

Sistem parkir pintar berbasis Computer Vision untuk memantau ketersediaan slot parkir secara *real-time*.

## Struktur Proyek
- `ai_server/`: Skrip Python untuk pemrosesan citra dari kamera HP dan pengiriman data status ke MQTT Broker.
- `web_dashboard/`: Dashboard Next.js untuk memantau status parkir secara *real-time*.

## Persiapan
Pastikan HP (sebagai kamera) dan Laptop berada dalam **jaringan Wi-Fi yang sama**.

### 1. Menjalankan AI Server
1. Masuk ke direktori `ai_server/`:
   ```bash
   cd ai_server
   ```
2. Pastikan sudah menginstal dependensi:
   ```bash
   pip install -r requirements.txt
   ```
3. Buka `main_requests.py` dan ganti `URL` dengan URL IP Webcam Anda (contoh: `http://192.168.1.x:8080/video`).
4. Jalankan skrip:
   ```bash
   python main_requests.py
   ```
   *Saat pertama kali dijalankan, arahkan kamera ke area parkir untuk kalibrasi otomatis.*

### 2. Menjalankan Web Dashboard
1. Masuk ke direktori `web_dashboard/`:
   ```bash
   cd web_dashboard
   ```
2. Pastikan sudah menginstal dependensi:
   ```bash
   npm install
   ```
3. Jalankan dashboard:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:3000` di browser Anda.

## Pengoperasian
- **Kalibrasi Ulang:** Jika kamera bergeser, tekan tombol `r` pada jendela preview AI Server untuk memulai ulang deteksi slot parkir.
- **Monitoring:** Status slot akan diperbarui secara otomatis di Dashboard melalui protokol MQTT.
- **Berhenti:** Tekan `q` pada jendela preview AI Server untuk menghentikan deteksi.
