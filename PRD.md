# Product Requirements Document (PRD) - Hardware Architecture
**Proyek:** Sistem Manajemen Parkir Pintar (AIoT)
**Sektor:** Infrastruktur IoT & Computer Vision

## 1. Ringkasan Eksekutif
Dokumen ini merinci spesifikasi dan fungsi dari setiap komponen perangkat keras yang digunakan dalam fase purwarupa (*prototyping*) sistem parkir pintar Garis Awan. Perangkat keras ini bertugas sebagai ujung tombak pengumpulan data visual (Edge Vision) dan papan informasi lokal (Local Display Node) yang terintegrasi penuh dengan *backend* berbasis MQTT dan visualisasi antarmuka Next.js.

---

## 2. Unit Komputasi & Visi Utama (Edge Nodes)
Komponen pada kategori ini berfungsi sebagai otak pemrosesan dan mata dari sistem.

### 2.1. ESP32 DevKit V1 (Wi-Fi & Bluetooth)
* **Kuantitas:** 1 Unit
* **Spesifikasi Teknis:** Dual-core Xtensa 32-bit LX6, Clock 240 MHz, SRAM 520 KB, Wi-Fi 802.11 b/g/n, Bluetooth v4.2 BR/EDR & BLE.
* **Peran Sistem:** Bertindak sebagai *Local Display Controller*. Unit ini berlangganan (*subscribe*) ke topik MQTT untuk menerima *payload* JSON yang berisi status 6 slot parkir.
* **Kriteria Penerimaan (Acceptance Criteria):** Harus mampu menjaga koneksi Wi-Fi secara stabil dan mem-*parsing* pesan JSON tanpa *memory leak*.

### 2.2. ESP32-CAM dengan Modul Kamera OV2640
* **Kuantitas:** 1 Unit
* **Spesifikasi Teknis:** Kamera 2 Megapixel (OV2640), dukungan output gambar JPEG/BMP/Grayscale, dilengkapi slot MicroSD (opsional), LED Flash.
* **Peran Sistem:** Bertindak sebagai sensor visual utama (*The Eye*). Dipasang dengan sudut *top-down* di atas maket untuk melakukan *streaming* video nirkabel ke laptop/server lokal yang menjalankan algoritma *Computer Vision* (OpenCV).
* **Kriteria Penerimaan:** Mampu memancarkan *video stream* beresolusi stabil (minimal 640x480) ke jaringan lokal dengan *latency* seminimal mungkin.

---

## 3. Unit Antarmuka Visual (Local Display)
Komponen ini merepresentasikan papan reklame digital di area parkir dunia nyata untuk mengarahkan pengemudi.

### 3.1. LCD 1602 dengan Modul I2C
* **Kuantitas:** 1 Unit
* **Spesifikasi Teknis:** Layar 16 karakter x 2 baris, *backlight* biru/kuning hijau, Modul komunikasi I2C (PCF8574).
* **Peran Sistem:** Menampilkan total sisa slot parkir yang tersedia di area. Penggunaan modul I2C menghemat penggunaan pin ESP32 (hanya membutuhkan pin SDA dan SCL).
* **Kriteria Penerimaan:** Kontras teks harus dapat terbaca jelas dalam kondisi pencahayaan ruangan standar.

### 3.2. Lampu LED Merah (Indikator Slot)
* **Kuantitas:** 6 Unit
* **Spesifikasi Teknis:** Diameter 5mm, Tegangan kerja (*Forward Voltage*) ~2.0V, Arus ~20mA.
* **Peran Sistem:** Indikator okupansi *real-time* untuk 6 slot parkir individual. LED menyala (HIGH) ketika algoritma *Computer Vision* mendeteksi adanya mobil di titik *Region of Interest* (ROI) terkait.

### 3.3. Resistor 330 Ohm
* **Kuantitas:** 6 Unit
* **Spesifikasi Teknis:** Hambatan 330 Ohm, Toleransi 5%, Daya 1/4 Watt.
* **Peran Sistem:** Pembatas arus (*Current Limiter*) untuk melindungi keenam LED dan pin digital ESP32 dari kelebihan beban arus (*overcurrent*). Pemasangan wajib diletakkan di antara kaki Katoda LED dan pin *Ground* (atau Anoda dan pin Digital).

---

## 4. Infrastruktur Perakitan (Prototyping Kit)
Elemen pasif yang menopang seluruh sirkuit agar dapat berjalan tanpa penyolderan.

### 4.1. Breadboard (Project Board) 400 Titik
* **Kuantitas:** 1 Unit
* **Spesifikasi Teknis:** Model *Half-Size* (400 lubang), dilengkapi rel *power* terpisah (Merah/Biru) di kedua sisinya.
* **Peran Sistem:** Papan sirkuit sementara untuk menancapkan ESP32 utama, 6 pasang LED beserta resistornya, dan mendistribusikan jalur daya (5V dan GND).

### 4.2. Kabel Jumper Dupont Male-to-Male
* **Kuantitas:** 1 Deret (Minimal 20 helai terpakai)
* **Spesifikasi Teknis:** Panjang 20cm, ujung pin runcing di kedua sisi.
* **Peran Sistem:** Menghubungkan pin GPIO dari ESP32 (yang tertancap di *breadboard*) melompat ke jalur komponen LED/Resistor, serta mendistribusikan daya dari pin 5V/GND ESP32 ke rel *power breadboard*.

### 4.3. Kabel Jumper Dupont Female-to-Male
* **Kuantitas:** 1 Deret (Minimal 4 helai terpakai)
* **Spesifikasi Teknis:** Panjang 20cm, satu ujung lubang, satu ujung runcing.
* **Peran Sistem:** Mengintegrasikan layar LCD I2C ke *breadboard*. Ujung *Female* masuk ke pin Modul I2C (VCC, GND, SDA, SCL), sedangkan ujung *Male* ditancapkan ke jalur ESP32 di *breadboard*.

### 4.4. Kabel Jumper Dupont Female-to-Female
* **Kuantitas:** 1 Deret (Minimal 5 helai terpakai)
* **Spesifikasi Teknis:** Panjang 20cm, lubang di kedua sisi.
* **Peran Sistem:** Digunakan khusus pada tahap awal (*flashing/upload*) untuk menghubungkan pin-pin ESP32-CAM ke alat *programmer* eksternal (Modul FTDI USB-to-TTL).

---

## 5. Ringkasan Alokasi Pin (*Pinout Mapping*)

Tabel berikut menjadi acuan perakitan fisik untuk menghubungkan mikrokontroler dengan perangkat periferal:

| Komponen Periferal | Pin Periferal | Pin ESP32 (DevKit V1) | Fungsi |
| :--- | :--- | :--- | :--- |
| **LCD 1602 I2C** | VCC | 5V (VIN) | Suplai Daya Utama |
| **LCD 1602 I2C** | GND | GND | Ground |
| **LCD 1602 I2C** | SDA | GPIO 21 | Komunikasi Data I2C |
| **LCD 1602 I2C** | SCL | GPIO 22 | Sinyal Clock I2C |
| **LED Slot 1** | Anoda (+) | GPIO 13 | Sinyal Kontrol Digital |
| **LED Slot 2** | Anoda (+) | GPIO 12 | Sinyal Kontrol Digital |
| **LED Slot 3** | Anoda (+) | GPIO 14 | Sinyal Kontrol Digital |
| **LED Slot 4** | Anoda (+) | GPIO 27 | Sinyal Kontrol Digital |
| **LED Slot 5** | Anoda (+) | GPIO 26 | Sinyal Kontrol Digital |
| **LED Slot 6** | Anoda (+) | GPIO 25 | Sinyal Kontrol Digital |
| **Semua LED** | Katoda (-) -> Resistor 330 Ohm | Rel GND Breadboard | Penutup Sirkuit / Pembatas Arus |