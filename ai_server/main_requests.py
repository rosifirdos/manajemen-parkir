import cv2
import numpy as np
import paho.mqtt.client as mqtt
import json
import time
import requests

# --- KONFIGURASI ---
# URL stream video dari ESP32-CAM (OV2640)
# Ganti dengan IP ESP32-CAM Anda di jaringan lokal
URL = "http://192.168.1.100:81/stream"

# Konfigurasi MQTT
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC_STATUS = "kelompok_iot/parking/status"
MQTT_TOPIC_WOKWI = "garisawan/parking/display"

# Jumlah slot parkir target (sesuai PRD: 6 LED)
NUM_SLOTS = 6

PIXEL_THRESHOLD = 5000

# State untuk menyimpan ROI hasil deteksi otomatis
auto_slots = []  # Akan berisi list [x, y, w, h]

def find_slots_automatically(frame, target_slots=6):
    """Mendeteksi kotak parkir secara otomatis dengan pembersihan noise.
    
    Args:
        frame: Frame video dari kamera
        target_slots: Jumlah slot yang dicari (default: 6)
    
    Returns:
        List koordinat [x, y, w, h] yang terdeteksi, diurutkan kiri-ke-kanan lalu atas-ke-bawah
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # Gunakan Canny + Dilate untuk memastikan garis tebal menyatu
    edged = cv2.Canny(blur, 40, 120)
    kernel = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(edged, kernel, iterations=1)

    # Cari kontur
    contours, _ = cv2.findContours(dilated.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    detected_boxes = []
    for c in contours:
        # Filter kontur yang terlalu kecil sebelum pemrosesan berat
        if cv2.contourArea(c) < 3000:
            continue

        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)

        # Cari bentuk dengan 4-6 sudut (untuk antisipasi distorsi kamera)
        if 4 <= len(approx) <= 6:
            x, y, w, h = cv2.boundingRect(approx)
            area = w * h
            aspect_ratio = float(w) / h

            # Filter berdasarkan ukuran dan rasio (10:15 = 0.67)
            if 5000 < area < 150000 and 0.3 < aspect_ratio < 1.2:
                # Cek apakah kotak ini tidak tumpang tindih dengan yang sudah ada
                is_duplicate = False
                for b in detected_boxes:
                    if abs(x - b[0]) < 20 and abs(y - b[1]) < 20:
                        is_duplicate = True
                        break

                if not is_duplicate:
                    detected_boxes.append([x, y, w, h])

    # Urutkan: pertama berdasarkan baris (y), lalu berdasarkan kolom (x)
    # Ini untuk menangani layout 2 baris x 3 kolom
    if len(detected_boxes) > 3:
        # Tentukan threshold baris (separuh tinggi frame)
        frame_mid_y = frame.shape[0] // 2
        top_row = sorted([b for b in detected_boxes if b[1] < frame_mid_y], key=lambda b: b[0])
        bottom_row = sorted([b for b in detected_boxes if b[1] >= frame_mid_y], key=lambda b: b[0])
        detected_boxes = top_row + bottom_row
    else:
        detected_boxes = sorted(detected_boxes, key=lambda b: b[0])

    return detected_boxes[:target_slots]


# --- INITIALIZATION ---
client = mqtt.Client()
try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    print("✅ Terhubung ke MQTT Broker")
except Exception as e:
    print(f"❌ Gagal terhubung ke MQTT: {e}")


def check_occupancy(frame, roi):
    """Memeriksa apakah slot parkir terisi berdasarkan analisis piksel."""
    x, y, w, h = roi
    # Pastikan koordinat dalam batas frame
    frame_h, frame_w = frame.shape[:2]
    x = max(0, min(x, frame_w - 1))
    y = max(0, min(y, frame_h - 1))
    w = min(w, frame_w - x)
    h = min(h, frame_h - y)
    
    slot_crop = frame[y:y+h, x:x+w]
    if slot_crop.size == 0:
        return 0, 0

    gray = cv2.cvtColor(slot_crop, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 1)
    thresh = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 25, 16
    )
    count = cv2.countNonZero(thresh)
    return 1 if count > PIXEL_THRESHOLD else 0, count


def connect_stream(url, max_retries=5):
    """Mencoba koneksi ke stream ESP32-CAM dengan retry."""
    for attempt in range(max_retries):
        try:
            print(f"📷 Koneksi ke ESP32-CAM (percobaan {attempt + 1}/{max_retries})...")
            stream = requests.get(url, stream=True, timeout=10)
            if stream.status_code == 200:
                print("✅ Stream ESP32-CAM terhubung!")
                return stream
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Gagal: {e}")
        time.sleep(3)
    
    print("❌ Tidak dapat terhubung ke ESP32-CAM.")
    return None


# --- MAIN ---
print("=" * 50)
print("  SMART PARKING SYSTEM - Auto Detection Mode")
print("  Sumber Video: ESP32-CAM (OV2640)")
print("=" * 50)
print(f"  Target Slot : {NUM_SLOTS}")
print(f"  MQTT Broker : {MQTT_BROKER}")
print("=" * 50)
print("\nSTATUS: Mode Deteksi Otomatis Aktif.")
print("Arahkan ESP32-CAM ke area parkir maket...")

stream = connect_stream(URL)
if stream is None:
    print("Keluar dari program.")
    exit(1)

bytes_data = bytes()
is_calibrated = False
previous_status = {}

try:
    for chunk in stream.iter_content(chunk_size=1024):
        bytes_data += chunk
        a = bytes_data.find(b'\xff\xd8')
        b = bytes_data.find(b'\xff\xd9')

        if a != -1 and b != -1:
            jpg = bytes_data[a:b+2]
            bytes_data = bytes_data[b+2:]

            if not jpg:
                continue

            try:
                frame = cv2.imdecode(
                    np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR
                )
            except Exception as decode_err:
                print(f"⚠️  Gagal decode frame: {decode_err}")
                continue

            if frame is not None:
                # FASE 1: KALIBRASI OTOMATIS
                if not is_calibrated:
                    auto_slots = find_slots_automatically(frame, NUM_SLOTS)

                    # Tampilkan panduan di layar
                    cv2.putText(
                        frame, 
                        f"Mencari Slot: {len(auto_slots)}/{NUM_SLOTS} Terdeteksi",
                        (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2
                    )

                    for idx, box in enumerate(auto_slots):
                        x, y, w, h = box
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 255), 2)
                        cv2.putText(frame, f"P{idx+1}", (x+5, y+25), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

                    # Kalibrasi berhasil jika minimal 3 slot terdeteksi
                    if len(auto_slots) >= 3:
                        is_calibrated = True
                        print(f"✅ {len(auto_slots)} Slot Terdeteksi. Mengunci Posisi.")

                # FASE 2: DETEKSI OKUPANSI
                else:
                    status_data = {}
                    available_count = 0

                    for i, roi in enumerate(auto_slots):
                        slot_id = f"slot_{i+1}"
                        is_occupied, pixel_count = check_occupancy(frame, roi)
                        status_data[slot_id] = is_occupied

                        color = (0, 0, 255) if is_occupied else (0, 255, 0)
                        if not is_occupied:
                            available_count += 1

                        x, y, w, h = roi
                        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 3)
                        label = f"P{i+1}: {'X' if is_occupied else 'O'}"
                        cv2.putText(frame, label, (x+5, y+25), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                    status_data["available"] = available_count
                    status_data["available_slots"] = available_count  # Untuk Wokwi
                    status_data["total_slots"] = len(auto_slots)
                    status_data["timestamp"] = int(time.time())

                    # Kirim data ke MQTT hanya jika ada perubahan
                    current_slots = {k: v for k, v in status_data.items() 
                                     if k.startswith("slot_")}
                    if current_slots != previous_status:
                        client.publish(MQTT_TOPIC_STATUS, json.dumps(status_data))
                        client.publish(MQTT_TOPIC_WOKWI, json.dumps(status_data))
                        previous_status = current_slots.copy()
                        print(f"📤 Data terkirim: {available_count}/{len(auto_slots)} tersedia")

                    cv2.putText(frame, f"LOCKED | Tersedia: {available_count}/{len(auto_slots)}", 
                                (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    cv2.putText(frame, "'r' = Kalibrasi Ulang | 'q' = Keluar", 
                                (20, frame.shape[0] - 20),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

                cv2.imshow("Smart Parking (Auto-Mode) - 6 Slot", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            if key == ord('r'):
                is_calibrated = False
                previous_status = {}
                print("🔄 RESET: Memulai kalibrasi ulang...")

except KeyboardInterrupt:
    print("\n⚠️  Dihentikan oleh pengguna.")
except Exception as e:
    print(f"❌ Koneksi terputus: {e}")

cv2.destroyAllWindows()
client.loop_stop()
client.disconnect()
print("\n✅ Program dihentikan dengan aman.")
