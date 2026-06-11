"use client";

import { useEffect, useState, useCallback } from "react";
import mqtt, { MqttClient } from "mqtt";
import Navbar from "./components/Navbar";
import StatsHeader from "./components/StatsHeader";
import ParkingSlotCard from "./components/ParkingSlotCard";
import ParkingMap from "./components/ParkingMap";

interface ParkingData {
  slot_1: number;
  slot_2: number;
  slot_3: number;
  slot_4: number;
  slot_5: number;
  slot_6: number;
  available: number;
  available_slots: number;
  total_slots: number;
  timestamp: number;
}

const TOTAL_SLOTS = 6;
const MQTT_BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";
const MQTT_TOPIC = "kelompok_iot/parking/status";

export default function Home() {
  const [data, setData] = useState<ParkingData | null>(null);
  const [mqttStatus, setMqttStatus] = useState("Connecting...");
  const [camUrl, setCamUrl] = useState("http://192.168.1.100:81/stream");
  const [camError, setCamError] = useState(false);
  const [history, setHistory] = useState<ParkingData[]>([]);

  // Send data to analytics API when received
  const saveToHistory = useCallback(async (payload: ParkingData) => {
    try {
      await fetch("/api/parking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silently fail — analytics is non-critical
    }
  }, []);

  useEffect(() => {
    let client: MqttClient;

    try {
      client = mqtt.connect(MQTT_BROKER_URL, {
        reconnectPeriod: 3000,
        connectTimeout: 10000,
      });

      client.on("connect", () => {
        setMqttStatus("Connected to MQTT Broker");
        client.subscribe(MQTT_TOPIC, (err) => {
          if (err) {
            console.error("Subscribe error:", err);
          }
        });
      });

      client.on("message", (_topic, message) => {
        try {
          const payload: ParkingData = JSON.parse(message.toString());
          setData(payload);
          setHistory((prev) => [...prev.slice(-100), payload]);
          saveToHistory(payload);
        } catch (e) {
          console.error("Failed to parse MQTT message", e);
        }
      });

      client.on("error", (err) => {
        console.error("MQTT Error:", err);
        setMqttStatus("Connection Error");
      });

      client.on("reconnect", () => {
        setMqttStatus("Reconnecting...");
      });

      client.on("offline", () => {
        setMqttStatus("Offline");
      });
    } catch (err) {
      console.error("MQTT connection failed:", err);
      setMqttStatus("Connection Failed");
    }

    return () => {
      if (client) {
        client.end();
      }
    };
  }, [saveToHistory]);

  const getSlotValue = (num: number): number => {
    if (!data) return 0;
    const key = `slot_${num}` as keyof ParkingData;
    return (data[key] as number) ?? 0;
  };

  const availableCount = data?.available ?? data?.available_slots ?? TOTAL_SLOTS;

  // Build slots object for ParkingMap
  const slotsMap: Record<string, number> = {};
  for (let i = 1; i <= TOTAL_SLOTS; i++) {
    slotsMap[`slot_${i}`] = getSlotValue(i);
  }

  return (
    <>
      <Navbar mqttStatus={mqttStatus} />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Stats Header */}
        <div className="mb-8">
          <StatsHeader
            available={availableCount}
            total={data?.total_slots ?? TOTAL_SLOTS}
            lastUpdate={data?.timestamp ?? null}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Camera Feed + Parking Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Feed */}
            <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
              <div className="relative">
                {/* Live Badge */}
                <div className="absolute top-4 left-4 z-10 live-badge">
                  Live Camera Feed
                </div>

                {/* Camera Stream */}
                {!camError ? (
                  <img
                    src={camUrl}
                    alt="ESP32-CAM Parking Stream"
                    className="w-full aspect-video object-cover bg-[var(--bg-primary)]"
                    onError={() => setCamError(true)}
                  />
                ) : (
                  <div className="w-full aspect-video bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-3 border-b border-[var(--border-subtle)]">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-3xl">
                      📷
                    </div>
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                      Kamera tidak terhubung
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Pastikan ESP32-CAM aktif dan URL sudah benar
                    </p>
                    <button
                      onClick={() => setCamError(false)}
                      className="mt-2 px-4 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>

              {/* Camera URL Input */}
              <div className="p-4 flex items-center gap-3 border-t border-[var(--border-subtle)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">
                  ESP32-CAM:
                </span>
                <input
                  type="text"
                  value={camUrl}
                  onChange={(e) => {
                    setCamUrl(e.target.value);
                    setCamError(false);
                  }}
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--text-secondary)] focus:outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="http://192.168.1.100:81/stream"
                />
              </div>
            </div>

            {/* Parking Map */}
            <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
              <ParkingMap slots={slotsMap} />
            </div>
          </div>

          {/* RIGHT: Slot Status Cards */}
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Status Slot Parkir
              </h2>
            </div>

            {/* 6 Slot Cards */}
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <ParkingSlotCard
                key={num}
                slotNumber={num}
                isOccupied={getSlotValue(num)}
              />
            ))}

            {/* System Info */}
            <div className="pt-4 mt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                MQTT Topic: {MQTT_TOPIC}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                Updates: {history.length} received
              </div>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="mt-8 glass-card p-4 border-l-2 border-l-indigo-500 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-indigo-400 block mb-1">💡 Cara Menggunakan:</strong>
            Pastikan ESP32-CAM aktif dan AI Server (Python) berjalan. Letakkan mobil-mobilan
            di atas maket parkir — status slot akan berubah otomatis secara real-time.
            Kunjungi halaman <a href="/analytics" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors">Analytics</a> untuk melihat insight data historis.
          </p>
        </div>
      </main>
    </>
  );
}
