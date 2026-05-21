# Rencana Pelaksanaan Proyek (Project Roadmap)
## Smart Parking System Berbasis Computer Vision (AIoT)

Dokumen ini berisi rangkuman perencanaan menyeluruh untuk proyek kelompok pengembangan **Sistem Manajemen Slot Parkir Pintar** berbasis *Artificial Intelligence of Things* (AIoT). Proyek ini berfokus pada efisiensi pemantauan slot parkir menggunakan satu kamera pengawas (*CCTV/IP Cam*) yang menggantikan peran sensor fisik per slot, terintegrasi dengan *Web Dashboard* dan fitur *Data Analytics*.

---

## 1. Arsitektur Global Sistem

Sistem dirancang menggunakan pendekatan hibrida (*hybrid architecture*) yang memisahkan antara pemrosesan citra lokal, transmisi data berbasis *cloud*, dan visualisasi antarmuka pengguna.

```text
[ Kamera HP / IP Cam ] 
         | (Wireless Video Stream / RTSP)
         v
[ Laptop / Edge Server (Python + OpenCV) ]
         | (Protokol MQTT - JSON Payload)
         v
[ Cloud MQTT Broker (HiveMQ) ]
         | (WebSockets / MQTT Client)
         v
[ Web Dashboard & Analytics (Next.js + Tailwind CSS) ]
```

---

## 2. Fase Pengembangan Proyek

### Fase 1: Riset Awal & Pembentukan MVP (Minimum Viable Product)
Fase ini berfokus pada pembuktian konsep (*Proof of Concept*) bahwa kamera dapat digunakan sebagai sensor okupansi tanpa memerlukan perangkat keras tambahan yang rumit.

1. **Setup Perangkat Kamera Sementara (IP Webcam):**
   * Menggunakan smartphone Android yang diinstal aplikasi **IP Webcam**.
   * Menjalankan server lokal pada aplikasi untuk menghasilkan URL *streaming* video mentah berbasis protokol HTTP/MJPEG (contoh: `http://192.168.1.XX:8080/video`).
   * Menghubungkan HP dan laptop pengolah ke jaringan Wi-Fi yang sama (*same subnet*).
2. **Pengembangan Skrip Pengolah Citra (Python & OpenCV):**
   * Membaca *stream* video menggunakan fungsi `cv2.VideoCapture(URL)`.
   * Menentukan koordinat *Region of Interest* (ROI) untuk 3 slot parkir secara manual pada matriks piksel gambar.
   * Menerapkan pra-pemrosesan citra (*Image Preprocessing*):
     * Konversi ke skala abu-abu (*Grayscale*).
     * Reduksi derau (*Noise reduction*) menggunakan *Gaussian Blur*.
     * Segmentasi biner menggunakan *Adaptive Thresholding* untuk memisahkan latar belakang lantai dengan objek mobil.
3. **Kalibrasi Logika Okupansi:**
   * Menggunakan fungsi `cv2.countNonZero()` untuk menghitung piksel putih di dalam setiap ROI kotak parkir.
   * Menentukan nilai ambang batas (`PIXEL_THRESHOLD`) melalui eksperimen: jika jumlah piksel putih melebihi ambang batas, slot dinyatakan **Terisi (1)**, jika kurang dinyatakan **Kosong (0)**.

### Fase 2: Pembangunan Infrastruktur Jaringan & Data Engineering
Fase ini berfokus pada bagaimana data status parkir yang dihasilkan oleh skrip Python dapat dikirimkan ke internet secara cepat dan efisien.

1. **Standardisasi Data (JSON Payload):**
   * Menyusun struktur data yang ringan untuk dikirimkan setiap detik atau hanya ketika terjadi perubahan status okupansi.
   * Format payload:
     ```json
     {
       "slot_1": 1,
       "slot_2": 0,
       "slot_3": 0,
       "available": 2,
       "timestamp": 1782012345
     }
     ```
2. **Implementasi Protokol MQTT:**
   * Menggunakan *library* `paho-mqtt` di sisi Python.
   * Menghubungkan sistem ke *Cloud MQTT Broker* publik gratis (`broker.hivemq.com`) menggunakan port standar `1883`.
   * Menentukan *Topic* unik kelompok untuk menghindari tabrakan data dengan proyek lain (contoh: `garisawan/parking/status`).

### Fase 3: Pengembangan Antarmuka Web Dashboard
Fase ini berfokus pada pembuatan aplikasi web modern yang bertugas menampilkan kondisi parkir secara *real-time* kepada pengguna atau petugas.

1. **Tech Stack & UI Desain:**
   * **Framework:** Next.js (React) untuk performa rendering dan struktur routing yang rapi.
   * **Styling:** Tailwind CSS dengan menerapkan tema **Dark Mode** minimalis (menggunakan palet warna berbasis *Slate* atau *Zinc*) untuk kenyamanan visual monitoring jangka panjang.
2. **Konsumsi Data Real-Time:**
   * Mengintegrasikan library `mqtt.js` pada Next.js agar web dapat berlangganan (*subscribe*) langsung ke topik MQTT.
   * Menggunakan *state management* React (`useState`, `useEffect`) untuk memperbarui tampilan grid parkir secara instan tanpa perlu melakukan *refresh* halaman web.
3. **Komponen Visual Antarmuka:**
   * **Peta/Grid Slot:** Representasi visual berbentuk kotak dinamis yang berubah warna secara instan (Hijau untuk Kosong, Merah untuk Terisi).
   * **Counter Card:** Menampilkan jumlah total slot yang tersedia secara besar dan jelas di bagian atas dashboard.

### Fase 4: Implementasi Fitur Data Analytics
Nilai akademis utama dari proyek Informatika ini terletak pada pemrosesan data historis untuk menghasilkan wawasan (*insight*).

1. **Penyimpanan Data Historis:**
   * Mengirimkan data dari MQTT ke database relasional (seperti PostgreSQL) untuk mencatat setiap log perubahan status parkir.
2. **Metrik Analisis yang Diolah:**
   * **Peak Hours Analysis (Analisis Jam Sibuk):** Mengagregasikan data historis berdasarkan jam untuk menampilkan grafik garis (*Line Chart*) menggunakan **Chart.js** atau **Recharts**. Informasi ini memberi tahu manajemen pada jam berapa saja area parkir mencapai okupansi penuh.
   * **Slot Preference Analysis (Analisis Preferensi Slot):** Menghitung frekuensi penggunaan masing-masing slot untuk mengetahui area mana yang paling diminati pengendara (misal: slot yang paling dekat dengan pintu keluar).
   * **Average Parking Duration (Rata-rata Durasi Parkir):** Menghitung selisih waktu antara status slot berubah dari `0 -> 1` hingga kembali ke `0`, memberikan metrik rata-rata lama kendaraan parkir.

### Fase 5: Perakitan Fisik Maket & Demofest
Fase akhir untuk mempersiapkan presentasi fisik di depan dosen penguji.

1. **Konstruksi Maket Sederhana:**
   * Menyediakan papan alas menggunakan bahan triplek ringan atau akrilik yang dicat warna hitam *matte* menyerupai aspal jalanan.
   * Membuat garis pembatas untuk 3 slot parkir menggunakan stiker *vinyl* putih atau isolasi kertas.
2. **Dudukan Kamera Penyangga:**
   * Membangun tiang vertikal menggunakan pipa PVC kecil atau tripod di sisi maket untuk menempatkan kamera HP secara *top-down* (tegak lurus menghadap ke bawah) agar sudut pandang ROI stabil.
3. **Uji Coba Akhir (End-to-End Test):**
   * Melakukan simulasi menaruh mobil-mobilan mini di atas maket.
   * Memastikan perubahan di maket fisik langsung mengubah warna kotak di layar OpenCV Python, mengirimkan data JSON via MQTT, dan memperbarui grafik serta grid di Web Dashboard Next.js dalam hitungan milidetik.

---

## 3. Estimasi Anggaran Biaya Hardware (Rill Implementasi)

Karena fungsi sensor dialihkan sepenuhnya ke software (*Computer Vision*), anggaran hardware menjadi sangat minimalis:

| No | Komponen / Material | Estimasi Harga | Keterangan |
| :--- | :--- | :--- | :--- |
| 1 | Kamera HP Android (IP Webcam) | Rp0 | Memanfaatkan perangkat yang sudah dimiliki anggota tim |
| 2 | Papan Alas Maket (MDF / Triplek) | Rp30.000 - Rp50.000 | Fondasi area parkir miniatur |
| 3 | Tiang Penyangga Kamera (Pipa PVC / Stand) | Rp25.000 - Rp40.000 | Untuk menjaga stabilitas sudut pandang kamera |
| 4 | Mobil-mobilan Mini (3 Unit) | Rp30.000 | Objek deteksi visual |
| 5 | Bahan Pendukung (Cat hitam, lakban, lem) | Rp25.000 | Estetika tampilan maket |
| 6 | Cloud Infrastructure (MQTT & Web Host) | Rp0 | Menggunakan *free tier* HiveMQ dan Vercel |
| **TOTAL** | | **Rp110.000 - Rp145.000** | **Sangat Ekonomis** |

---

## 4. Pembagian Peran Kelompok

Menerapkan *framework* **Hustler, Hipster, Hacker** agar pengerjaan proyek efisien dan sesuai dengan keahlian:

* **Hacker (AI & Backend Engineer):**
  * Bertanggung jawab menulis skrip Python OpenCV, melakukan kalibrasi ROI, dan menentukan `PIXEL_THRESHOLD`.
  * Mengonfigurasi konektivitas MQTT dan memastikan pengiriman data JSON berjalan mulus tanpa interupsi.
* **Hipster (UI/UX & Frontend Developer):**
  * Bertanggung jawab mendesain antarmuka dashboard yang bersih dan modern di Next.js menggunakan Tailwind CSS.
  * Mengintegrasikan grafik visualisasi analytics (*Recharts/Chart.js*) agar data mudah dipahami saat demo proyek.
* **Hustler (Project Manager & Hardware Maker):**
  * Bertanggung jawab menyusun rancangan maket fisik, memastikan kamera terpasang kokoh, dan mengoordinasikan jadwal pengerjaan tim.
  * Menyusun skenario presentasi dan laporan akhir untuk dosen penguji.