# Panduan Pembuatan Maket & Kalibrasi Deteksi

Untuk menguji sistem Smart Parking ini tanpa area parkir asli, Anda perlu membuat **Maket (Miniatur)** sederhana. Sistem ini bekerja dengan mendeteksi perubahan piksel (warna/tekstur) di area yang sudah ditentukan.

## 1. Persiapan Alas (Lantai Parkir)
*   **Bahan:** Gunakan karton hitam, papan kayu gelap, atau permukaan meja yang warnanya **gelap dan polos**.
*   **Alasan:** Lantai yang gelap memberikan kontras tinggi saat ada mobil (yang biasanya punya warna lebih terang atau refleksi cahaya) masuk ke kotak.

## 2. Membuat Garis Parkir (ROI)
*   **Bahan:** Gunakan lakban putih, stiker vinyl, atau spidol perak.
*   **Layout:** Buat 3 kotak persegi panjang yang berjajar. Ukuran ideal untuk mobil-mobilan kecil (HotWheels) adalah sekitar **10cm x 15cm** per kotak.
*   **Penting:** Pastikan garis putih terlihat jelas dan kontras dengan lantai hitam.

## 3. Posisi Kamera (Sudut Pandang)
*   **Posisi:** Tempatkan kamera HP (IP Webcam) tepat di atas maket menghadap ke bawah (**Top-Down View**).
*   **Stabilitas:** Gunakan tripod atau sandarkan HP di tumpukan buku/tiang agar kamera tidak goyang.
*   **Alasan:** Logika koordinat `[x, y, w, h]` di kode `main_requests.py` sangat bergantung pada posisi kamera yang tetap. Jika kamera bergeser, kotak deteksi di layar tidak akan pas lagi dengan garis maket.

## 4. Objek Deteksi
*   **Bahan:** Mobil-mobilan mini (HotWheels/Matchbox) atau benda apapun yang ukurannya cukup memenuhi kotak parkir.
*   **Variasi:** Coba gunakan mobil dengan warna yang berbeda-beda untuk mengetes sensitivitas deteksi.

## 5. Cara Kalibrasi (PENTING)
Jika saat dijalankan kotak tetap merah padahal kosong, atau tetap hijau padahal ada mobil, Anda perlu mengatur:

1.  **PIXEL_THRESHOLD (Baris 24 di main_requests.py):**
    *   Jika terlalu sensitif (kosong tapi terbaca penuh): **Naikkan** nilainya (misal ke `8000`).
    *   Jika kurang sensitif (ada mobil tapi terbaca kosong): **Turunkan** nilainya (misal ke `3000`).

2.  **Koordinat PARKING_SLOTS (Baris 16-20):**
    *   Jalankan program, lihat di mana kotak muncul di layar.
    *   Geser nilai `x` dan `y` di kode agar kotak tepat berada di dalam garis parkir yang Anda buat secara fisik.

---

### Ilustrasi Layout Maket:
```text
      [ KAMERA HP ]
           |
           v
_______________________  <-- Lantai Gelap
|  [P1]  |  [P2]  |  [P3]  |
|  Slot  |  Slot  |  Slot  |  <-- Garis Putih
|________|________|________|
```

Dengan setup ini, sistem akan mendeteksi "gangguan" piksel di dalam kotak (mobil) dan mengubah status dari **Kosong (0)** ke **Terisi (1)**.
