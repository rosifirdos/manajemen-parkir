"use client";

interface StatsHeaderProps {
  available: number;
  total: number;
  lastUpdate: number | null;
}

export default function StatsHeader({ available, total, lastUpdate }: StatsHeaderProps) {
  const occupancy = total > 0 ? Math.round(((total - available) / total) * 100) : 0;

  const getOccupancyColor = () => {
    if (occupancy >= 80) return "text-red-400";
    if (occupancy >= 50) return "text-amber-400";
    return "text-emerald-400";
  };

  const getOccupancyBg = () => {
    if (occupancy >= 80) return "bg-red-500";
    if (occupancy >= 50) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
      {/* Available Slots */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-emerald-dim)] border border-emerald-500/20 flex items-center justify-center">
          <span className="text-2xl">🅿️</span>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Slot Tersedia
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-400 animate-count-up">
              {available}
            </span>
            <span className="text-sm text-[var(--text-muted)] font-medium">
              / {total}
            </span>
          </div>
        </div>
      </div>

      {/* Occupancy Rate */}
      <div className="glass-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Tingkat Okupansi
        </p>
        <div className="flex items-center gap-4">
          <span className={`text-3xl font-black ${getOccupancyColor()} animate-count-up`}>
            {occupancy}%
          </span>
          <div className="flex-1">
            <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getOccupancyBg()} transition-all duration-700 ease-out`}
                style={{ width: `${occupancy}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-indigo-dim)] border border-indigo-500/20 flex items-center justify-center">
          <span className="text-2xl">⏱️</span>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Update Terakhir
          </p>
          <p className="text-sm font-mono font-semibold text-[var(--text-primary)]">
            {lastUpdate
              ? new Date(lastUpdate * 1000).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "Menunggu data..."}
          </p>
        </div>
      </div>
    </div>
  );
}
