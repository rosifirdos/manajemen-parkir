"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PeakHoursData {
  hour: number;
  label: string;
  avgOccupancy: number;
  samples: number;
}

interface PeakHoursChartProps {
  data: PeakHoursData[];
}

export default function PeakHoursChart({ data }: PeakHoursChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--text-muted)] text-sm">
        Belum ada data. Jalankan AI Server untuk mulai mengumpulkan data.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 32, 48, 0.8)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#5c6078" }}
          tickLine={false}
          axisLine={{ stroke: "#1e2030" }}
          interval={2}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#5c6078" }}
          tickLine={false}
          axisLine={{ stroke: "#1e2030" }}
          domain={[0, 6]}
          ticks={[0, 1, 2, 3, 4, 5, 6]}
        />
        <Tooltip
          contentStyle={{
            background: "#0f1117",
            border: "1px solid #1e2030",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#e4e5eb",
          }}
          labelFormatter={(label) => `Jam ${label}`}
          formatter={(value) => [`${value} slot`, "Rata-rata Terisi"]}
        />
        <Line
          type="monotone"
          dataKey="avgOccupancy"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#818cf8", strokeWidth: 2, stroke: "#6366f1" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
