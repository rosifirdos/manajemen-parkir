"use client";

import { useEffect, useState, useCallback } from "react";
import mqtt, { MqttClient } from "mqtt";
import Navbar from "../components/Navbar";
import PeakHoursChart from "../components/charts/PeakHoursChart";
import SlotPreferenceChart from "../components/charts/SlotPreferenceChart";
import OccupancyTimeline from "../components/charts/OccupancyTimeline";

const MQTT_BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";
const MQTT_TOPIC = "kelompok_iot/parking/status";

interface DurationData {
  slot: string;
  slotId: string;
  avgDurationSeconds: number;
  avgDurationMinutes: number;
  totalSessions: number;
}

export default function AnalyticsPage() {
  const [mqttStatus, setMqttStatus] = useState("Connecting...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [peakHoursData, setPeakHoursData] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [slotPrefData, setSlotPrefData] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [durationData, setDurationData] = useState<DurationData[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [peakRes, prefRes, timeRes, durRes] = await Promise.all([
        fetch("/api/parking?type=peak_hours"),
        fetch("/api/parking?type=slot_preference"),
        fetch("/api/parking?type=timeline"),
        fetch("/api/parking?type=duration"),
      ]);

      if (peakRes.ok) setPeakHoursData(await peakRes.json());
      if (prefRes.ok) setSlotPrefData(await prefRes.json());
      if (timeRes.ok) setTimelineData(await timeRes.json());
      if (durRes.ok) setDurationData(await durRes.json());

      const allRes = await fetch("/api/parking?type=all");
      if (allRes.ok) {
        const allData = await allRes.json();
        setTotalRecords(allData.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  }, []);

  // MQTT connection + periodic fetch
  useEffect(() => {
    let client: MqttClient;
    let intervalId: NodeJS.Timeout;

    try {
      client = mqtt.connect(MQTT_BROKER_URL, {
        reconnectPeriod: 3000,
        connectTimeout: 10000,
      });

      client.on("connect", () => {
        setMqttStatus("Connected to MQTT Broker");
        client.subscribe(MQTT_TOPIC);
      });

      client.on("message", async (_topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          // Save to API
          await fetch("/api/parking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch {
          // Silent fail
        }
      });

      client.on("error", () => setMqttStatus("Connection Error"));
      client.on("reconnect", () => setMqttStatus("Reconnecting..."));
      client.on("offline", () => setMqttStatus("Offline"));
    } catch {
      setMqttStatus("Connection Failed");
    }

    // Fetch analytics data every 5 seconds
    fetchAnalytics();
    intervalId = setInterval(fetchAnalytics, 5000);

    return () => {
      if (client) client.end();
      clearInterval(intervalId);
    };
  }, [fetchAnalytics]);

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return "-";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <>
      <Navbar mqttStatus={mqttStatus} />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-2xl font-black text-white tracking-tight">
            📊 Data Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Insight dan analisis data historis parkir secara real-time
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Total Record: {totalRecords}
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors uppercase tracking-wider"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Hours */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-indigo-500 rounded-full" />
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Analisis Jam Sibuk
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Rata-rata jumlah slot terisi per jam
                </p>
              </div>
            </div>
            <PeakHoursChart data={peakHoursData} />
          </div>

          {/* Slot Preference */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-purple-500 rounded-full" />
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Preferensi Slot
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Frekuensi penggunaan masing-masing slot
                </p>
              </div>
            </div>
            <SlotPreferenceChart data={slotPrefData} />
          </div>

          {/* Occupancy Timeline */}
          <div className="glass-card p-6 lg:col-span-2 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-emerald-500 rounded-full" />
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Timeline Okupansi
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Perubahan jumlah slot terisi dan kosong dari waktu ke waktu
                </p>
              </div>
            </div>
            <OccupancyTimeline data={timelineData} />
          </div>
        </div>

        {/* Duration Table */}
        <div className="mt-6 glass-card p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Rata-rata Durasi Parkir
              </h2>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Estimasi rata-rata lama kendaraan parkir per slot
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Slot
                  </th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Rata-rata Durasi
                  </th>
                  <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Total Sesi
                  </th>
                </tr>
              </thead>
              <tbody>
                {durationData.map((row, idx) => (
                  <tr
                    key={row.slotId}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {idx + 1}
                        </div>
                        <span className="font-medium text-[var(--text-primary)]">{row.slot}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-[var(--text-primary)]">
                      {formatDuration(row.avgDurationSeconds)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-secondary)]">
                        {row.totalSessions} sesi
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {durationData.every((d) => d.totalSessions === 0) && (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              Belum ada data durasi. Data akan muncul setelah ada kendaraan yang masuk dan keluar.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
