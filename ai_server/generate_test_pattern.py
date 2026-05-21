import cv2
import numpy as np

def generate_parking_pattern():
    # Buat gambar hitam polos (Lantai Parkir)
    # Ukuran 1280x720 (HD)
    width, height = 1280, 720
    img = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Warna
    white = (255, 255, 255)
    
    # Gambar 3 Kotak Parkir di Tengah
    # Format: cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)
    slot_width = 250
    slot_height = 400
    gap = 50
    start_x = (width - (3 * slot_width + 2 * gap)) // 2
    start_y = (height - slot_height) // 2
    
    for i in range(3):
        x1 = start_x + i * (slot_width + gap)
        y1 = start_y
        x2 = x1 + slot_width
        y2 = y1 + slot_height
        
        # Gambar garis kotak putih
        cv2.rectangle(img, (x1, y1), (x2, y2), white, 5)
        # Tambahkan Label
        cv2.putText(img, f"SLOT {i+1}", (x1 + 60, y1 + 220), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.5, white, 3)

    # Tampilkan Gambar
    cv2.imshow("TEST PATTERN - POINT YOUR PHONE HERE", img)
    print("Gambar tes berhasil dibuat.")
    print("1. Arahkan HP (IP Webcam) Anda ke layar laptop ini.")
    print("2. Jalankan main_requests.py di terminal lain.")
    print("3. Gunakan benda (misal: tangan atau botol) di depan layar untuk simulasi parkir.")
    print("Tekan sembarang tombol di jendela ini untuk menutup.")
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    generate_parking_pattern()
