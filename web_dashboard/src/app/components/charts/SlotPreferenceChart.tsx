"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SlotPreferenceData {
  slot: string;
  slotId: string;
  usage: number;
  percentage: number;
}

interface SlotPreferenceChartProps {
  data: SlotPreferenceData[];
}

const COLORS = ["#6366f1", "#818cf8", "#a78bfa", "#c4b5fd", "#8b5cf6", "#7c3aed"];

export default function SlotPreferenceChart({ data }: SlotPreferenceChartProps) {
  if (data.length === 0 || data.every((d) => d.usage === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--text-muted)] text-sm">
        Belum ada data preferensi slot.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 32, 48, 0.8)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "#5c6078" }}
          tickLine={false}
          axisLine={{ stroke: "#1e2030" }}
        />
        <YAxis
          dataKey="slot"
          type="category"
          tick={{ fontSize: 11, fill: "#8b8fa3", fontWeight: 600 }}
          tickLine={false}
          axisLine={{ stroke: "#1e2030" }}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: "#0f1117",
            border: "1px solid #1e2030",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#e4e5eb",
          }}
          formatter={(value, _name, props) => [
            `${value} kali terisi (${(props as { payload: SlotPreferenceData }).payload.percentage}%)`,
            "Frekuensi",
          ]}
        />
        <Bar dataKey="usage" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
