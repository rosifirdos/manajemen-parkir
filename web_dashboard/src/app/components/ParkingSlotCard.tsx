"use client";

interface ParkingSlotCardProps {
  slotNumber: number;
  isOccupied: number;
}

export default function ParkingSlotCard({ slotNumber, isOccupied }: ParkingSlotCardProps) {
  const occupied = isOccupied === 1;

  return (
    <div
      className={`
        glass-card p-4 flex items-center justify-between transition-all duration-500
        ${occupied ? "slot-occupied" : "slot-available"}
      `}
      style={{ animationDelay: `${slotNumber * 80}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* Slot Number Badge */}
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg
            border transition-all duration-500
            ${
              occupied
                ? "bg-red-500/20 border-red-500/30 text-red-400"
                : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
            }
          `}
        >
          {slotNumber}
        </div>

        {/* Slot Info */}
        <div>
          <div className="font-bold text-sm text-[var(--text-primary)]">
            Slot {slotNumber}
          </div>
          <div
            className={`
              text-[10px] uppercase font-bold tracking-[0.15em]
              ${occupied ? "text-red-400" : "text-emerald-400"}
            `}
          >
            {occupied ? "Terisi" : "Tersedia"}
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div
        className={`
          px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-500
          ${
            occupied
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }
        `}
      >
        {occupied ? "🔒 LOCKED" : "✅ OPEN"}
      </div>
    </div>
  );
}
