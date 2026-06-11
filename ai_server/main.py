import cv2
import numpy as np
import paho.mqtt.client as mqtt
import json
import time

# --- KONFIGURASI ---
# URL stream video dari ESP32-CAM (OV2640)
# Ganti dengan IP ESP32-CAM Anda di jaringan lokal
# Format: http://<IP_ESP32CAM>/stream atau http://<IP_ESP32CAM>:81/stream
VIDEO_SOURCE = "http://192.168.1.100:81/stream"

# Konfigurasi MQTT
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC_STATUS = "kelompok_iot/parking/status"
MQTT_TOPIC_WOKWI = "garisawan/parking/display"

# Jumlah slot parkir (sesuai PRD: 6 LED pada GPIO 13, 12, 14, 27, 26, 25)
NUM_SLOTS = 6

# Koordinat ROI (Region of Interest) - Silakan sesuaikan dengan tampilan kamera Anda
# Format: [x, y, w, h]
# Layout maket 6 slot (2 baris x 3 kolom):
#   Baris atas:  [Slot 1] [Slot 2] [Slot 3]
#   Baris bawah: [Slot 4] [Slot 5] [Slot 6]
PARKING_SLOTS = {
    "slot_1": [30,  50, 90, 130],
    "slot_2": [140, 50, 90, 130],
    "slot_3": [250, 50, 90, 130],
    "slot_4": [30,  220, 90, 130],
    "slot_5": [140, 220, 90, 130],
    "slot_6": [250, 220, 90, 130]
}

# Ambang batas piksel (Threshold)
# Jika jumlah piksel putih > PIXEL_THRESHOLD, maka slot dianggap terisi
PIXEL_THRESHOLD = 5000

# --- INITIALIZATION ---
client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Terhubung ke MQTT Broker")
    else:
        print(f"❌ Gagal terhubung ke MQTT, kode: {rc}")

def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("⚠️  Koneksi MQTT terputus, mencoba reconnect...")

client.on_connect = on_connect
client.on_disconnect = on_disconnect

try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
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

    # Preprocessing
    gray = cv2.cvtColor(slot_crop, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 1)
    thresh = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 25, 16
    )

    # Hitung piksel non-zero (piksel putih)
    count = cv2.countNonZero(thresh)
    return 1 if count > PIXEL_THRESHOLD else 0, count

def connect_camera(source, max_retries=5):
    """Mencoba menghubungkan ke kamera dengan retry mechanism."""
    for attempt in range(max_retries):
        print(f"📷 Mencoba koneksi ke kamera (percobaan {attempt + 1}/{max_retries})...")
        cap = cv2.VideoCapture(source)
        if cap.isOpened():
            print("✅ Kamera terhubung!")
            return cap
        print(f"⚠️  Gagal. Menunggu 3 detik...")
        time.sleep(3)
    
    print("❌ Tidak dapat terhubung ke kamera setelah semua percobaan.")
    return None

# --- MAIN LOOP ---
print("=" * 50)
print("  SMART PARKING SYSTEM - 6 Slot Detection")
print("  Sumber Video: ESP32-CAM (OV2640)")
print("=" * 50)
print(f"  MQTT Broker : {MQTT_BROKER}")
print(f"  Topic Status: {MQTT_TOPIC_STATUS}")
print(f"  Topic Wokwi : {MQTT_TOPIC_WOKWI}")
print(f"  Total Slot  : {NUM_SLOTS}")
print("=" * 50)

cap = connect_camera(VIDEO_SOURCE)
if cap is None:
    print("Keluar dari program.")
    exit(1)

print("\nMemulai deteksi... Tekan 'q' untuk berhenti.")

previous_status = {}

while True:
    ret, frame = cap.read()
    if not ret:
        print("⚠️  Gagal mengambil frame. Mencoba reconnect...")
        cap.release()
        cap = connect_camera(VIDEO_SOURCE, max_retries=3)
        if cap is None:
            print("❌ Reconnect gagal. Keluar.")
            break
        continue

    status_data = {}
    available_count = 0

    for slot_id, roi in PARKING_SLOTS.items():
        is_occupied, pixel_count = check_occupancy(frame, roi)
        status_data[slot_id] = is_occupied

        if is_occupied == 0:
            available_count += 1
            color = (0, 255, 0)  # Hijau (Kosong)
        else:
            color = (0, 0, 255)  # Merah (Terisi)

        # Gambar kotak ROI di frame utama
        x, y, w, h = roi
        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
        label = f"{slot_id}: {'TERISI' if is_occupied else 'KOSONG'} ({pixel_count})"
        cv2.putText(frame, label, (x, y-10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

    status_data["available"] = available_count
    status_data["available_slots"] = available_count  # Untuk Wokwi
    status_data["total_slots"] = NUM_SLOTS
    status_data["timestamp"] = int(time.time())

    # Kirim data ke MQTT hanya jika ada perubahan status
    current_slots = {k: v for k, v in status_data.items() 
                     if k.startswith("slot_")}
    if current_slots != previous_status:
        client.publish(MQTT_TOPIC_STATUS, json.dumps(status_data))
        client.publish(MQTT_TOPIC_WOKWI, json.dumps(status_data))
        previous_status = current_slots.copy()
        print(f"📤 Data terkirim: {available_count}/{NUM_SLOTS} slot tersedia")

    # Info overlay di frame
    cv2.putText(frame, f"Tersedia: {available_count}/{NUM_SLOTS}", 
                (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(frame, "Tekan 'q' untuk berhenti", 
                (10, frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, 
                (200, 200, 200), 1)

    # Tampilkan Preview
    cv2.imshow("Smart Parking Detection (6 Slot)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
client.loop_stop()
client.disconnect()
print("\n✅ Program dihentikan dengan aman.")
