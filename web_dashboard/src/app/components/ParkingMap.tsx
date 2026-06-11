"use client";

interface ParkingMapProps {
  slots: Record<string, number>;
}

export default function ParkingMap({ slots }: ParkingMapProps) {
  const getSlotStatus = (num: number): number => {
    return slots[`slot_${num}`] ?? 0;
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-indigo-500 rounded-full" />
        <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
          Peta Area Parkir
        </h2>
      </div>

      {/* Top-Down Parking Map */}
      <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-subtle)]">
        {/* Entry arrow */}
        <div className="flex justify-center mb-3">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="text-xs font-bold uppercase tracking-wider">Masuk</span>
            <span>↓</span>
          </div>
        </div>

        {/* Parking Grid - 2 rows x 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const occupied = getSlotStatus(num) === 1;
            return (
              <div
                key={num}
                className={`
                  relative aspect-[2/3] rounded-lg border-2 border-dashed
                  flex flex-col items-center justify-center gap-1
                  transition-all duration-500
                  ${
                    occupied
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-emerald-500/30 bg-emerald-500/5"
                  }
                `}
              >
                {/* Car icon or empty */}
                <span className="text-2xl">
                  {occupied ? "🚗" : ""}
                </span>
                <span
                  className={`
                    text-[10px] font-bold uppercase tracking-wider
                    ${occupied ? "text-red-400" : "text-emerald-400/60"}
                  `}
                >
                  P{num}
                </span>
              </div>
            );
          })}
        </div>

        {/* Exit arrow */}
        <div className="flex justify-center mt-3">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <span>↓</span>
            <span className="text-xs font-bold uppercase tracking-wider">Keluar</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" />
          <span className="text-[10px] text-[var(--text-muted)] font-medium">Kosong</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/40" />
          <span className="text-[10px] text-[var(--text-muted)] font-medium">Terisi</span>
        </div>
      </div>
    </div>
  );
}
