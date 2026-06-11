"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TimelineData {
  timestamp: number;
  time: string;
  occupied: number;
  available: number;
}

interface OccupancyTimelineProps {
  data: TimelineData[];
}

export default function OccupancyTimeline({ data }: OccupancyTimelineProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--text-muted)] text-sm">
        Belum ada data timeline.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="occupiedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="availableGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 32, 48, 0.8)" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "#5c6078" }}
          tickLine={false}
          axisLine={{ stroke: "#1e2030" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#5c6078" }}
          tickLine={false}
          axisLine={{ stroke: "#1e2030" }}
          domain={[0, 6]}
          ticks={[0, 2, 4, 6]}
        />
        <Tooltip
          contentStyle={{
            background: "#0f1117",
            border: "1px solid #1e2030",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#e4e5eb",
          }}
          formatter={(value, name) => [
            `${value} slot`,
            name === "occupied" ? "Terisi" : "Kosong",
          ]}
        />
        <Area
          type="stepAfter"
          dataKey="occupied"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#occupiedGrad)"
          name="occupied"
        />
        <Area
          type="stepAfter"
          dataKey="available"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#availableGrad)"
          name="available"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
