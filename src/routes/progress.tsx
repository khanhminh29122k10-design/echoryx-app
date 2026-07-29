import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { RequireAuth, useAuth } from "@/lib/auth";
import { progressApi, type ProgressReport } from "@/lib/api";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress report · EchoRyx" },
      { name: "description", content: "Milestones your child hit this month." },
      { property: "og:title", content: "Progress report · EchoRyx" },
      { property: "og:description", content: "Skills, streaks and growth." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Progress />
    </RequireAuth>
  ),
});

function Progress() {
  const { activeChild } = useAuth();
  const [report, setReport] = useState<ProgressReport | null>(null);

  useEffect(() => {
    if (!activeChild) return;
    progressApi.report(activeChild.id).then(setReport).catch(() => undefined);
  }, [activeChild]);

  const skills = report
    ? [
        { name: "Vocabulary", v: report.skills.vocabulary },
        { name: "Attention", v: report.skills.attention },
        { name: "Empathy", v: report.skills.empathy },
        { name: "Problem solving", v: report.skills.problemSolving },
      ]
    : [];

  return (
    <MobileFrame>
      <ScreenHeader title="Progress report" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Kpi n={report ? String(report.kpis.sessions) : "—"} l="Sessions" />
        <Kpi n={report ? `${report.kpis.learningHours}h` : "—"} l="Learning" />
        <Kpi n={report ? String(report.kpis.badges) : "—"} l="Badges" />
      </div>

      <div className="rounded-2xl p-4 bg-card border border-border/60 shadow-card">
        <div className="text-sm font-semibold mb-2">Growth over recent weeks</div>
        {report && report.growth.length > 0 ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={report.growth}>
              <defs><linearGradient id="lg" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="oklch(0.62 0.19 258)" /><stop offset="100%" stopColor="oklch(0.72 0.18 245)" /></linearGradient></defs>
              <XAxis dataKey="week" tick={{ fill: "oklch(0.72 0.04 258)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.06 265)", border: "none", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="url(#lg)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground py-8 text-center">No weekly data yet — finish a conversation with Niso to start tracking growth.</p>
        )}
      </div>

      <h2 className="font-bold mt-5 mb-3">Skills</h2>
      <div className="space-y-3">
        {skills.map((s) => (
          <div key={s.name}>
            <div className="flex justify-between text-xs mb-1"><span>{s.name}</span><span className="text-primary-glow font-semibold">{s.v}%</span></div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full gradient-primary" style={{ width: `${s.v}%` }} />
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </MobileFrame>
  );
}
function Kpi({ n, l }: any) {
  return (
    <div className="rounded-2xl p-3 bg-card border border-border/60 text-center">
      <div className="text-lg font-bold text-gradient">{n}</div>
      <div className="text-[10px] text-muted-foreground">{l}</div>
    </div>
  );
}
