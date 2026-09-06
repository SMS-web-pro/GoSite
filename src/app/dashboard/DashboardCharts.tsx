"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartData {
  stageData: { stage: string; count: number; key: string }[];
  currencyData: { name: string; value: number; color: string }[];
  monthlyData: { month: string; count: number }[];
}

const stageColors: Record<string, string> = {
  discovered: "#67766a",
  contacted: "#4ade80",
  demo_sent: "#a78bfa",
  quoted: "#fbbf24",
  deposit_paid: "#d9ff4d",
  paid: "#22c55e",
  delivered: "#3b82f6",
  completed: "#10b981",
  lost: "#ef4444",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold text-[#e8efe8] mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-[#9fb3a4]">
          <span style={{ color: entry.color }}>{entry.name || entry.dataKey}:</span>{" "}
          <span className="font-bold text-[#e8efe8]">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardCharts({ data, revenueTotal }: { data: ChartData; revenueTotal: string }) {
  const { stageData, currencyData, monthlyData } = data;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Prospects over time — Area chart */}
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6">
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #4ade80, #22c55e)" }} />
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#4ade80]">Activité</p>
            <h3 className="mt-1 text-lg font-extrabold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Prospects / mois
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#67766a]">Total 6 mois</p>
            <p className="text-lg font-bold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {monthlyData.reduce((s, m) => s + m.count, 0)}
            </p>
          </div>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,255,220,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#67766a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#67766a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Prospects" stroke="#4ade80" strokeWidth={2.5} fill="url(#gradGreen)" dot={{ r: 4, fill: "#4ade80", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#d9ff4d" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by currency — Donut chart */}
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6">
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #d9ff4d, #a78bfa)" }} />
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#d9ff4d]">Revenus</p>
            <h3 className="mt-1 text-lg font-extrabold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Répartition par devise
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#67766a]">Total</p>
            <p className="text-lg font-bold text-[#d9ff4d]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {revenueTotal}
            </p>
          </div>
        </div>
        {currencyData.length > 0 ? (
          <div className="flex items-center gap-6">
            <div className="h-[220px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {currencyData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3">
              {currencyData.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                  <div>
                    <p className="text-xs text-[#67766a]">{c.name}</p>
                    <p className="text-sm font-bold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {new Intl.NumberFormat("fr-FR").format(c.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-[220px] items-center justify-center">
            <p className="text-sm text-[#67766a]">Aucun revenu enregistré</p>
          </div>
        )}
      </div>

      {/* Prospects by stage — Bar chart (full width) */}
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(236,255,220,0.09)] bg-[#0e120f] p-6 lg:col-span-2">
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #a78bfa, #4ade80)" }} />
        <div className="mb-5">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#a78bfa]">Pipeline</p>
          <h3 className="mt-1 text-lg font-extrabold text-[#e8efe8]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Prospects par étape du workflow
          </h3>
        </div>
        {stageData.length > 0 ? (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,255,220,0.06)" vertical={false} />
                <XAxis dataKey="stage" tick={{ fill: "#67766a", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: "#67766a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(236,255,220,0.03)" }} />
                <Bar dataKey="count" name="Prospects" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {stageData.map((entry, i) => (
                    <Cell key={i} fill={stageColors[entry.key] || "#67766a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[260px] items-center justify-center">
            <p className="text-sm text-[#67766a]">Aucun prospect enregistré</p>
          </div>
        )}
      </div>
    </div>
  );
}
