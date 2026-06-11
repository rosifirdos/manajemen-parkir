# Panduan Pembuatan Maket & Kalibrasi Deteksi

Untuk menguji sistem Smart Parking ini tanpa area parkir asli, Anda perlu membuat **Maket (Miniatur)** sederhana. Sistem ini bekerja dengan mendeteksi perubahan piksel (warna/tekstur) di area yang sudah ditentukan.

> **Catatan:** Panduan detail lengkap dengan diagram wiring dan langkah perakitan hardware ada di [PANDUAN_PERAKITAN_HARDWARE.md](PANDUAN_PERAKITAN_HARDWARE.md)

## 1. Persiapan Alas (Lantai Parkir)
*   **Bahan:** Gunakan karton hitam, papan MDF gelap, atau triplek yang dicat **hitam matte**.
*   **Ukuran:** Minimal **40 cm × 25 cm** untuk menampung 6 slot parkir.
*   **Alasan:** Lantai yang gelap memberikan kontras tinggi saat ada mobil (yang biasanya punya warna lebih terang atau refleksi cahaya) masuk ke kotak.

## 2. Membuat Garis Parkir (6 Slot / ROI)
*   **Bahan:** Gunakan lakban putih, stiker vinyl, atau spidol perak.
*   **Layout:** Buat **6 kotak** parkir dalam **2 baris × 3 kolom**. Ukuran ideal untuk mobil-mobilan kecil (HotWheels) adalah sekitar **10cm × 15cm** per kotak, dengan jarak antar kotak **2 cm**.
*   **Penting:** Pastikan garis putih terlihat jelas dan kontras dengan lantai hitam.

## 3. Posisi Kamera (Sudut Pandang)
*   **Posisi:** Tempatkan **ESP32-CAM** tepat di atas maket menghadap ke bawah (**Top-Down View**).
*   **Tinggi:** Ideal **30-40 cm** di atas permukaan maket.
*   **Stabilitas:** Gunakan tiang PVC, tripod mini, atau bracket yang dilem ke sisi maket agar kamera tidak goyang.
*   **Alasan:** Logika koordinat `[x, y, w, h]` di kode `main_requests.py` sangat bergantung pada posisi kamera yang tetap. Jika kamera bergeser, kotak deteksi di layar tidak akan pas lagi dengan garis maket.

## 4. Objek Deteksi
*   **Bahan:** 6 buah mobil-mobilan mini (HotWheels/Matchbox) atau benda apapun yang ukurannya cukup memenuhi kotak parkir.
*   **Variasi:** Coba gunakan mobil dengan warna yang berbeda-beda untuk mengetes sensitivitas deteksi. Warna yang kontras dengan lantai hitam (putih, merah, kuning) memberikan hasil terbaik.

## 5. Cara Kalibrasi (PENTING)
Jika saat dijalankan kotak tetap merah padahal kosong, atau tetap hijau padahal ada mobil, Anda perlu mengatur:

1.  **PIXEL_THRESHOLD (di main_requests.py):**
    *   Jika terlalu sensitif (kosong tapi terbaca penuh): **Naikkan** nilainya (misal ke `8000`).
    *   Jika kurang sensitif (ada mobil tapi terbaca kosong): **Turunkan** nilainya (misal ke `3000`).

2.  **Kalibrasi Ulang:**
    *   Tekan tombol **`r`** pada jendela preview OpenCV untuk mereset dan memulai ulang deteksi slot.
    *   Pastikan pencahayaan merata tanpa bayangan tajam.

---

### Ilustrasi Layout Maket (6 Slot):
```text
         [ ESP32-CAM ]
              |
              v  (Top-Down View, 30-40cm)
  ________________________________
  |  [P1]  |  [P2]  |  [P3]  |     ← Baris Atas
  |  Slot  |  Slot  |  Slot  |
  |  10x15 |  10x15 |  10x15 |     (cm)
  |________|________|________|
  |  [P4]  |  [P5]  |  [P6]  |     ← Baris Bawah
  |  Slot  |  Slot  |  Slot  |
  |  10x15 |  10x15 |  10x15 |
  |________|________|________|
         ↑ Masuk / Keluar
```

Dengan setup ini, sistem akan mendeteksi "gangguan" piksel di dalam kotak (mobil) dan mengubah status dari **Kosong (0)** ke **Terisi (1)**.
