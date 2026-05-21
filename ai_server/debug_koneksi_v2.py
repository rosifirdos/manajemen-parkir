import cv2
import os

# --- KONFIGURASI ---
# Ganti dengan URL Anda (Pastikan ada /video di akhir)
URL = "GANTI_DENGAN_URL_KAMERA_ANDA/video"

def test_backends():
    print(f"--- Diagnostik OpenCV Lanjutan ---")
    print(f"Target URL: {URL}")
    
    # 1. Cek Protokol
    if not URL.startswith("http"):
        print("PERINGATAN: URL harus diawali dengan http:// atau https://")

    # 2. Coba berbagai backend
    # CAP_FFMPEG seringkali paling stabil untuk stream jaringan
    backends = [
        ("FFMPEG", cv2.CAP_FFMPEG),
        ("Default/Any", cv2.CAP_ANY),
    ]
    
    for name, backend in backends:
        print(f"\nMencoba backend: {name}...")
        try:
            # Tambahkan timeout jika didukung (tergantung versi OpenCV)
            cap = cv2.VideoCapture(URL, backend)
            
            if cap.isOpened():
                print(f"BERHASIL: Backend {name} dapat membuka stream.")
                ret, frame = cap.read()
                if ret:
                    print(f"SUKSES: Frame berhasil terbaca ({frame.shape[1]}x{frame.shape[0]})")
                    cv2.imshow("Debug Stream", frame)
                    print("Menampilkan video selama 3 detik...")
                    cv2.waitKey(3000)
                    cv2.destroyAllWindows()
                    cap.release()
                    return
                else:
                    print(f"GAGAL: Stream terbuka tapi tidak bisa membaca data frame.")
            else:
                print(f"GAGAL: Backend {name} tidak dapat membuka URL.")
            cap.release()
        except Exception as e:
            print(f"ERROR saat menggunakan {name}: {e}")

    print("\n--- Analisis Penyebab & Solusi ---")
    print("1. Kredensial: Apakah Anda mengatur 'Login/Password' di aplikasi IP Webcam?")
    print("   Jika ya, gunakan format: http://admin:password@192.168.1.XX:8080/video")
    print("2. Library: Pastikan opencv-python terinstal lengkap. Coba jalankan:")
    print("   pip uninstall opencv-python")
    print("   pip install opencv-contrib-python")
    print("3. Firewall: Pastikan Python diizinkan mengakses jaringan lokal.")

if __name__ == "__main__":
    if "GANTI_DENGAN_URL" in URL:
        print("Silakan edit file ini dan masukkan URL IP Webcam Anda!")
    else:
        test_backends()
