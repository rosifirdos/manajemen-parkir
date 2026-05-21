import cv2
import os

# --- KONFIGURASI ---
# Ganti dengan URL Anda (Pastikan ada /video di akhir)
URL = "GANTI_DENGAN_URL_KAMERA_ANDA/video"

def test_backends():
    print(f"--- Diagnostik OpenCV ---")
    print(f"Target URL: {URL}")
    
    # Daftar backend yang akan dicoba
    backends = [
        ("Default", cv2.CAP_ANY),
        ("FFMPEG", cv2.CAP_FFMPEG),
        ("DSHOW", cv2.CAP_DSHOW),
    ]
    
    for name, backend in backends:
        print(f"\nMencoba backend: {name}...")
        try:
            cap = cv2.VideoCapture(URL, backend)
            
            # Set timeout (beberapa backend mendukung ini)
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000)
            
            if cap.isOpened():
                print(f"BERHASIL: Backend {name} dapat membuka stream.")
                ret, frame = cap.read()
                if ret:
                    print(f"Frame terbaca: {frame.shape[1]}x{frame.shape[0]}")
                    cv2.imshow(f"Test {name}", frame)
                    cv2.waitKey(2000) # Tampilkan 2 detik
                    cv2.destroyAllWindows()
                    cap.release()
                    return # Keluar jika sudah berhasil satu
                else:
                    print(f"PERINGATAN: Backend {name} terbuka tapi tidak bisa membaca frame.")
            else:
                print(f"GAGAL: Backend {name} tidak dapat membuka stream.")
            
            cap.release()
        except Exception as e:
            print(f"ERROR pada {name}: {str(e)}")

    print("\n--- Kesimpulan & Saran ---")
    print("1. Pastikan URL diawali 'http://' bukan 'https://'.")
    print("2. Jika menggunakan Windows, pastikan tidak ada spasi di URL.")
    print("3. Coba ganti '/video' dengan '/shot.jpg' (untuk mode foto tunggal) sebagai tes.")
    print("4. Pastikan library opencv-python sudah versi terbaru.")

if __name__ == "__main__":
    if "GANTI_DENGAN_URL" in URL:
        print("Silakan edit file ini dan masukkan URL IP Webcam Anda terlebih dahulu!")
    else:
        test_backends()
