import cv2
import numpy as np
import paho.mqtt.client as mqtt
import json
import time

# --- KONFIGURASI ---
# Ganti dengan URL dari aplikasi IP Webcam (Android)
# Contoh: "http://192.168.1.10:8080/video"
VIDEO_SOURCE = "http://10.10.3.238:8080/video" 

# Konfigurasi MQTT
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC = "kelompok_iot/parking/status"

# Koordinat ROI (Region of Interest) - Silakan sesuaikan dengan tampilan kamera Anda
# Format: [x, y, w, h]
PARKING_SLOTS = {
    "slot_1": [50, 200, 100, 150],
    "slot_2": [200, 200, 100, 150],
    "slot_3": [350, 200, 100, 150]
}

# Ambang batas piksel (Threshold)
# Jika jumlah piksel putih > PIXEL_THRESHOLD, maka slot dianggap terisi
PIXEL_THRESHOLD = 5000 

# --- INITIALIZATION ---
client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    print(f"Terhubung ke MQTT Broker dengan kode: {rc}")

client.on_connect = on_connect

try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
except Exception as e:
    print(f"Gagal terhubung ke MQTT: {e}")

cap = cv2.VideoCapture(VIDEO_SOURCE)

def check_occupancy(frame, roi):
    x, y, w, h = roi
    # Crop area slot
    slot_crop = frame[y:y+h, x:x+w]
    
    # Preprocessing
    gray = cv2.cvtColor(slot_crop, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 1)
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
    
    # Hitung piksel non-zero (piksel putih)
    count = cv2.countNonZero(thresh)
    
    # Debug: Tampilkan frame thresh untuk kalibrasi
    # cv2.imshow(f"Thresh", thresh)
    
    return 1 if count > PIXEL_THRESHOLD else 0, count

print("Memulai deteksi... Tekan 'q' untuk berhenti.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Gagal mengambil frame dari kamera.")
        break

    status_data = {}
    available_count = 0

    for slot_id, roi in PARKING_SLOTS.items():
        is_occupied, pixel_count = check_occupancy(frame, roi)
        status_data[slot_id] = is_occupied
        
        if is_occupied == 0:
            available_count += 1
            color = (0, 255, 0) # Hijau (Kosong)
        else:
            color = (0, 0, 255) # Merah (Terisi)

        # Gambar kotak ROI di frame utama
        x, y, w, h = roi
        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
        cv2.putText(frame, f"{slot_id}: {pixel_count}", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    status_data["available"] = available_count
    status_data["timestamp"] = int(time.time())

    # Kirim data ke MQTT
    client.publish(MQTT_TOPIC, json.dumps(status_data))

    # Tampilkan Preview
    cv2.imshow("Smart Parking Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
client.loop_stop()
client.disconnect()
