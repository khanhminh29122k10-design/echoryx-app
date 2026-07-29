import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Weekly analytics · EchoRyx" },
      { name: "description", content: "Deep-dive into the week of screen time and learning." },
      { property: "og:title", content: "Weekly analytics · EchoRyx" },
      { property: "og:description", content: "Numbers behind the smiles." },
    ],
  }),
  component: Analytics,
});

const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => ({ d, watch: 40 + i*7, learn: 15 + i*4 }));

function Analytics() {
  return (
    <MobileFrame>
      <ScreenHeader title="Weekly analytics" />
      <div className="flex gap-2 mb-4">
        {["Week","Month","Year"].map((t, i) => (
          <button key={t} className={`flex-1 py-2 rounded-xl text-xs font-semibold ${i===0 ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border border-border"}`}>{t}</button>
        ))}
      </div>

      <div className="rounded-2xl p-4 bg-card border border-border/60 shadow-card">
        <div className="flex justify-between items-baseline">
          <div>
            <div className="text-xs text-muted-foreground">Total this week</div>
            <div className="text-2xl font-bold">11h 20m</div>
          </div>
          <div className="text-xs text-success">↑ 12%</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={days}>
            <defs>
              <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.62 0.19 258)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="oklch(0.62 0.19 258)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="d" tick={{ fill: "oklch(0.72 0.04 258)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "oklch(0.22 0.06 265)", border: "none", borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="watch" stroke="oklch(0.62 0.19 258)" strokeWidth={2} fill="url(#ag)" />
            <Area type="monotone" dataKey="learn" stroke="oklch(0.72 0.18 155)" strokeWidth={2} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 text-[11px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Watch time</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Learning</span>
        </div>
      </div>

      <h2 className="font-bold mt-5 mb-3">Top categories</h2>
      <div className="space-y-2">
        {[["Educational stories", 60],["Cartoons", 25],["Songs & music", 10],["Other", 5]].map(([n, v]) => (
          <div key={n} className="p-3 rounded-2xl bg-card border border-border/60">
            <div className="flex justify-between text-xs mb-2"><span>{n}</span><span className="font-semibold">{v}%</span></div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full gradient-primary" style={{ width: `${v}%` }} />
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </MobileFrame>
  );
}