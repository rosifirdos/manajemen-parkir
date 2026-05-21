import cv2
import numpy as np
import paho.mqtt.client as mqtt
import json
import time
import requests

# --- KONFIGURASI ---
URL = "http://10.10.3.238:8080/video" 

# Konfigurasi MQTT
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC = "kelompok_iot/parking/status"

PIXEL_THRESHOLD = 5000 

# State untuk menyimpan ROI hasil deteksi otomatis
auto_slots = [] # Akan berisi list [x, y, w, h]

def find_slots_automatically(frame):
    """Mendeteksi 3 kotak parkir secara otomatis dengan pembersihan noise"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Gunakan Canny + Dilate untuk memastikan garis tebal menyatu
    edged = cv2.Canny(blur, 40, 120)
    kernel = np.ones((3,3), np.uint8)
    dilated = cv2.dilate(edged, kernel, iterations=1)
    
    # Cari kontur
    contours, _ = cv2.findContours(dilated.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    detected_boxes = []
    for c in contours:
        # Filter kontur yang terlalu kecil sebelum pemrosesan berat
        if cv2.contourArea(c) < 5000:
            continue
            
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        
        # Cari bentuk dengan 4-6 sudut (untuk antisipasi distorsi kamera)
        if 4 <= len(approx) <= 6:
            x, y, w, h = cv2.boundingRect(approx)
            area = w * h
            aspect_ratio = float(w)/h
            
            # Filter berdasarkan ukuran dan rasio (10:15 = 0.67)
            if 10000 < area < 150000 and 0.4 < aspect_ratio < 0.9:
                # Cek apakah kotak ini tidak tumpang tindih dengan yang sudah ada
                is_duplicate = False
                for b in detected_boxes:
                    if abs(x - b[0]) < 20 and abs(y - b[1]) < 20:
                        is_duplicate = True
                        break
                
                if not is_duplicate:
                    detected_boxes.append([x, y, w, h])
    
    # Urutkan dari kiri ke kanan
    detected_boxes = sorted(detected_boxes, key=lambda b: b[0])
    return detected_boxes[:3]

# --- INITIALIZATION ---
client = mqtt.Client()
try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    print("DEBUG: Terhubung ke MQTT")
except Exception as e:
    print(f"ERROR MQTT: {e}")

def check_occupancy(frame, roi):
    x, y, w, h = roi
    # Pastikan koordinat dalam batas frame
    y = max(0, y); x = max(0, x)
    slot_crop = frame[y:y+h, x:x+w]
    if slot_crop.size == 0: return 0, 0
    
    gray = cv2.cvtColor(slot_crop, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 1)
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
    count = cv2.countNonZero(thresh)
    return 1 if count > PIXEL_THRESHOLD else 0, count

print("STATUS: Mode Deteksi Otomatis Aktif.")
print("Arahkan kamera ke gambar parkir...")

stream = requests.get(URL, stream=True)
bytes_data = bytes()
is_calibrated = False

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
                frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
            except Exception as decode_err:
                print(f"Warning: Failed to decode frame: {decode_err}")
                continue
            
            if frame is not None:
                # FASE 1: KALIBRASI OTOMATIS
                if not is_calibrated:
                    auto_slots = find_slots_automatically(frame)
                    
                    # Tampilkan panduan di layar
                    cv2.putText(frame, f"Mencari Slot: {len(auto_slots)}/3 Terdeteksi", (20, 40), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                    
                    for box in auto_slots:
                        x, y, w, h = box
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 255), 2)
                    
                    if len(auto_slots) == 3:
                        is_calibrated = True
                        print("SUKSES: 3 Slot Terdeteksi. Mengunci Posisi.")

                # FASE 2: DETEKSI OKUPANSI
                else:
                    status_data = {}
                    available_count = 0
                    
                    for i, roi in enumerate(auto_slots):
                        slot_id = f"slot_{i+1}"
                        is_occupied, pixel_count = check_occupancy(frame, roi)
                        status_data[slot_id] = is_occupied
                        
                        color = (0, 0, 255) if is_occupied else (0, 255, 0)
                        if not is_occupied: available_count += 1
                        
                        x, y, w, h = roi
                        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 3)
                        cv2.putText(frame, f"P{i+1}", (x+5, y+25), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

                    status_data["available"] = available_count
                    status_data["timestamp"] = int(time.time())
                    client.publish(MQTT_TOPIC, json.dumps(status_data))
                    
                    cv2.putText(frame, "STATUS: LOCKED", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    cv2.putText(frame, "Tekan 'r' untuk Kalibrasi Ulang", (20, frame.shape[0]-20), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

                cv2.imshow("Smart Parking (Auto-Mode)", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'): break
            if key == ord('r'): 
                is_calibrated = False
                print("RESET: Memulai kalibrasi ulang...")

except Exception as e:
    print(f"Koneksi terputus: {e}")

cv2.destroyAllWindows()
client.loop_stop()
client.disconnect()
