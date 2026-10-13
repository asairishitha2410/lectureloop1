"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StudyActivityDay } from "@/types";
import { chartSeries, colors } from "@/lib/theme";
import { formatMinutes } from "@/lib/utils";

const axis = { fontSize: 12, fill: "#94a3b8" };
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 8px 28px rgba(15,23,42,0.08)",
} as const;

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-sm text-slate-400 text-center px-6">
      {text}
    </div>
  );
}

export function WeeklyActivityChart({ data }: { data: StudyActivityDay[] }) {
  if (!data || data.length === 0) return <EmptyChart text="No study activity yet." />;
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatMinutes(Number(value)), "Study time"]}
            cursor={{ fill: "rgba(124,58,237,0.06)" }}
          />
          <Bar dataKey="minutes" radius={[8, 8, 0, 0]} barSize={32}>
            {data.map((d, i) => (
              <Cell
                key={d.date}
                fill={i === data.length - 1 ? chartSeries[0] : chartSeries[2]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QuizTrendChart({ data }: { data: { date: string; score: number }[] }) {
  if (!data || data.length === 0) return <EmptyChart text="Complete a quiz to see your score trend." />;
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Score"]} />
          <Line
            type="monotone"
            dataKey="score"
            stroke={chartSeries[0]}
            strokeWidth={3}
            dot={{ r: 4, fill: chartSeries[0] }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubjectProgressBars({
  data,
}: {
  data: { subject: string; progress: number; weak?: boolean }[];
}) {
  if (!data || data.length === 0) return <EmptyChart text="No subject data yet." />;
  return (
    <div className="space-y-4">
      {data.map((row) => (
        <div key={row.subject}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-slate-600">{row.subject}</span>
            <span className="text-xs font-bold text-navy">{row.progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (row.weak ?? false) ? "bg-gradient-to-r from-rose-400 to-rose-500" : "bg-gradient-to-r from-primary to-blue"
              }`}
              style={{ width: `${row.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopicAccuracyChart({ data }: { data: { topic: string; accuracy: number }[] }) {
  if (!data || data.length === 0) return <EmptyChart text="Take a quiz to measure accuracy per topic." />;
  const rows = data.slice(0, 8);
  return (
    <div style={{ width: "100%", height: Math.max(200, rows.length * 46) }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="topic"
            width={150}
            tick={{ ...axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${v}%`, "Accuracy"]}
            cursor={{ fill: "rgba(124,58,237,0.06)" }}
          />
          <Bar dataKey="accuracy" radius={[0, 6, 6, 0]} barSize={16}>
            {rows.map((entry, i) => (
              <Cell key={entry.topic} fill={entry.accuracy < 60 ? colors.rose : chartSeries[i % chartSeries.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DifficultyChart({ data }: { data: { name: string; accuracy: number }[] }) {
  if (!data || data.length === 0) return <EmptyChart text="Answer some questions to compare difficulty." />;
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Accuracy"]} />
          <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} barSize={38}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={chartSeries[i % chartSeries.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Generic pie-free progress ring used for revision completion.
export function LegendDots({ labels }: { labels: { name: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {labels.map((l) => (
        <span key={l.name} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
          {l.name}
        </span>
      ))}
    </div>
  );
}