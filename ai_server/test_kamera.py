import cv2

# Masukkan URL IP Webcam Anda di sini
# Contoh: http://192.168.1.10:8080/video
URL = "GANTI_DENGAN_URL_KAMERA_ANDA/video"

def test_connection():
    print(f"Mencoba menghubungkan ke: {URL}")
    cap = cv2.VideoCapture(URL)
    
    if not cap.isOpened():
        print("GAGAL: Tidak dapat membuka stream video.")
        print("Pastikan:")
        print("1. HP dan Laptop di Wi-Fi yang SAMA.")
        print("2. URL sudah benar (harus ada akhiran /video untuk IP Webcam).")
        print("3. Coba buka URL tersebut di browser laptop. Jika tidak muncul, masalah ada di jaringan.")
        return

    print("BERHASIL: Koneksi terhubung. Menampilkan video...")
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        cv2.imshow("Test Koneksi IP Webcam", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    test_connection()
