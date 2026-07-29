import { createFileRoute } from "@tanstack/react-router";
import { Calendar, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { RequireAuth, useAuth } from "@/lib/auth";
import { progressApi, type Dashboard } from "@/lib/api";

export const Route = createFileRoute("/parent")({
  head: () => ({
    meta: [
      { title: "Parent dashboard · EchoRyx" },
      { name: "description", content: "Track your child's viewing and learning at a glance." },
      { property: "og:title", content: "Parent dashboard · EchoRyx" },
      { property: "og:description", content: "Insights into every learning moment." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Parent />
    </RequireAuth>
  ),
});

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const PIE_COLORS = {
  educational: "oklch(0.62 0.19 258)",
  entertainment: "oklch(0.72 0.18 245)",
  other: "oklch(0.4 0.05 260)",
};

function Parent() {
  const { activeChild } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (!activeChild) return;
    progressApi.dashboard(activeChild.id).then(setDashboard).catch(() => undefined);
  }, [activeChild]);

  const bars = dashboard
    ? Array.from({ length: 24 }, (_, h) => ({ t: String(h).padStart(2, "0"), v: dashboard.watchByHour[String(h).padStart(2, "0")] ?? 0 }))
    : [];
  const pie = dashboard
    ? [
        { name: "Educational", v: dashboard.contentMix.educational, c: PIE_COLORS.educational },
        { name: "Entertainment", v: dashboard.contentMix.entertainment, c: PIE_COLORS.entertainment },
        { name: "Other", v: dashboard.contentMix.other, c: PIE_COLORS.other },
      ]
    : [];
  const energyPct = dashboard && dashboard.energyBudgetMinutes > 0
    ? Math.min(100, Math.round((dashboard.energyUsedMinutes / dashboard.energyBudgetMinutes) * 100))
    : 0;

  return (
    <MobileFrame>
      <ScreenHeader title="Dashboard" right={<button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center"><Calendar className="w-4 h-4" /></button>} />
      <p className="text-xs text-muted-foreground mb-4">{activeChild?.name ?? "No child selected"} · {dashboard?.date ?? "Today"}</p>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total watch time" value={dashboard ? formatDuration(dashboard.totalWatchSeconds) : "—"} />
        <Stat label="Interactions" value={dashboard ? String(dashboard.interactionsCount) : "—"} />
        <Stat label="Learning time" value={dashboard ? formatDuration(dashboard.learningSeconds) : "—"} />
        <div className="rounded-2xl p-4 bg-card border border-border/60 shadow-card">
          <div className="text-[11px] text-muted-foreground">Energy budget</div>
          <div className="mt-1 relative w-16 h-16 mx-auto">
            <svg viewBox="0 0 36 36" className="w-16 h-16">
              <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(0.28 0.06 265)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="oklch(0.62 0.19 258)"
                strokeWidth="3"
                strokeDasharray={`${energyPct} 100`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{energyPct}%</span>
          </div>
          <div className="text-[10px] text-center text-muted-foreground">
            {dashboard ? `${Math.round(dashboard.energyUsedMinutes)}m / ${dashboard.energyBudgetMinutes}m` : "—"}
          </div>
        </div>
      </div>

      <Card title="Watch time by hour">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={bars}>
            <XAxis dataKey="t" tick={{ fill: "oklch(0.72 0.04 258)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Bar dataKey="v" radius={[6, 6, 0, 0]} fill="url(#g)" />
            <defs>
              <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.18 245)" />
                <stop offset="100%" stopColor="oklch(0.5 0.19 260)" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Content mix">
        {dashboard && dashboard.totalWatchSeconds > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={pie} dataKey="v" innerRadius={30} outerRadius={50} paddingAngle={4}>
                  {pie.map((p, i) => <Cell key={i} fill={p.c} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2 flex-1">
              {pie.map((p) => (
                <li key={p.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: p.c }} />{p.name}</span>
                  <span className="font-semibold">{p.v}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No watch time recorded yet today.</p>
        )}
      </Card>

      <div className="rounded-2xl p-4 bg-card border border-border/60 shadow-card mt-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground"><TrendingUp className="w-5 h-5" /></div>
        <div className="flex-1">
          <div className="text-sm font-semibold">
            {dashboard && dashboard.interactionsCount > 0
              ? `${activeChild?.name ?? "Your child"} had ${dashboard.interactionsCount} conversation${dashboard.interactionsCount > 1 ? "s" : ""} with Niso today`
              : "No conversations with Niso yet today"}
          </div>
          <div className="text-[11px] text-muted-foreground">Check the Progress tab for weekly skill trends.</div>
        </div>
      </div>
      <BottomNav />
    </MobileFrame>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="rounded-2xl p-4 bg-card border border-border/60 shadow-card">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
function Card({ title, children }: any) {
  return (
    <div className="rounded-2xl p-4 bg-card border border-border/60 shadow-card mt-4">
      <div className="text-sm font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}
