import { NextRequest, NextResponse } from "next/server";

// In-memory store untuk data historis parkir
// Untuk produksi, ganti dengan database (PostgreSQL/SQLite)
interface ParkingRecord {
  slot_1: number;
  slot_2: number;
  slot_3: number;
  slot_4: number;
  slot_5: number;
  slot_6: number;
  available: number;
  timestamp: number;
}

const MAX_RECORDS = 5000; // Maksimal 5000 record di memory
const parkingHistory: ParkingRecord[] = [];

// POST: Simpan data status parkir baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const record: ParkingRecord = {
      slot_1: body.slot_1 ?? 0,
      slot_2: body.slot_2 ?? 0,
      slot_3: body.slot_3 ?? 0,
      slot_4: body.slot_4 ?? 0,
      slot_5: body.slot_5 ?? 0,
      slot_6: body.slot_6 ?? 0,
      available: body.available ?? body.available_slots ?? 6,
      timestamp: body.timestamp ?? Math.floor(Date.now() / 1000),
    };

    parkingHistory.push(record);

    // Auto-cleanup: hapus record lama jika melebihi batas
    while (parkingHistory.length > MAX_RECORDS) {
      parkingHistory.shift();
    }

    return NextResponse.json({ success: true, total: parkingHistory.length });
  } catch {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}

// GET: Ambil data historis untuk analytics
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";

  if (type === "peak_hours") {
    // Agregasi rata-rata okupansi per jam
    const hourlyData: Record<number, { total: number; count: number }> = {};

    for (let h = 0; h < 24; h++) {
      hourlyData[h] = { total: 0, count: 0 };
    }

    for (const record of parkingHistory) {
      const hour = new Date(record.timestamp * 1000).getHours();
      const occupied = 6 - record.available;
      hourlyData[hour].total += occupied;
      hourlyData[hour].count += 1;
    }

    const result = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      label: `${hour.padStart(2, "0")}:00`,
      avgOccupancy: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
      samples: data.count,
    }));

    return NextResponse.json(result);
  }

  if (type === "slot_preference") {
    // Hitung total waktu terisi per slot
    const slotUsage: Record<string, number> = {};
    for (let i = 1; i <= 6; i++) {
      slotUsage[`slot_${i}`] = 0;
    }

    for (const record of parkingHistory) {
      for (let i = 1; i <= 6; i++) {
        const key = `slot_${i}` as keyof ParkingRecord;
        if (record[key] === 1) {
          slotUsage[`slot_${i}`] += 1;
        }
      }
    }

    const total = parkingHistory.length || 1;
    const result = Object.entries(slotUsage).map(([slot, count]) => ({
      slot: slot.replace("_", " ").toUpperCase(),
      slotId: slot,
      usage: count,
      percentage: Math.round((count / total) * 100),
    }));

    return NextResponse.json(result);
  }

  if (type === "timeline") {
    // Return data 100 record terakhir untuk timeline
    const recent = parkingHistory.slice(-100).map((record) => ({
      timestamp: record.timestamp,
      time: new Date(record.timestamp * 1000).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      occupied: 6 - record.available,
      available: record.available,
    }));

    return NextResponse.json(recent);
  }

  if (type === "duration") {
    // Hitung estimasi durasi parkir per slot
    const durations: Record<string, number[]> = {};
    const lastOccupied: Record<string, number | null> = {};

    for (let i = 1; i <= 6; i++) {
      durations[`slot_${i}`] = [];
      lastOccupied[`slot_${i}`] = null;
    }

    for (const record of parkingHistory) {
      for (let i = 1; i <= 6; i++) {
        const key = `slot_${i}` as keyof ParkingRecord;
        const slotKey = `slot_${i}`;

        if (record[key] === 1 && lastOccupied[slotKey] === null) {
          // Mulai parkir
          lastOccupied[slotKey] = record.timestamp;
        } else if (record[key] === 0 && lastOccupied[slotKey] !== null) {
          // Selesai parkir — hitung durasi
          const duration = record.timestamp - (lastOccupied[slotKey] as number);
          if (duration > 0 && duration < 86400) {
            // Filter durasi > 0 dan < 24 jam
            durations[slotKey].push(duration);
          }
          lastOccupied[slotKey] = null;
        }
      }
    }

    const result = Object.entries(durations).map(([slot, durs]) => {
      const avgSeconds = durs.length > 0
        ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
        : 0;
      const avgMinutes = Math.round(avgSeconds / 60);

      return {
        slot: slot.replace("_", " ").toUpperCase(),
        slotId: slot,
        avgDurationSeconds: avgSeconds,
        avgDurationMinutes: avgMinutes,
        totalSessions: durs.length,
      };
    });

    return NextResponse.json(result);
  }

  // Default: return semua data (limited)
  return NextResponse.json({
    total: parkingHistory.length,
    recent: parkingHistory.slice(-50),
  });
}
