import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { RequireAuth, useAuth } from "@/lib/auth";
import { progressApi, type ProgressReport } from "@/lib/api";
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const [report, setReport] = useState<ProgressReport | null>(null);

  useEffect(() => {
    if (!activeChild) return;
    progressApi.report(activeChild.id).then(setReport).catch(() => undefined);
  }, [activeChild]);

  const skills = report
    ? [
        { name: t("progress.vocabulary"), v: report.skills.vocabulary },
        { name: t("progress.attention"), v: report.skills.attention },
        { name: t("progress.empathy"), v: report.skills.empathy },
        { name: t("progress.problemSolving"), v: report.skills.problemSolving },
      ]
    : [];

  return (
    <MobileFrame>
      <ScreenHeader title={t("progress.title")} />
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
        <Kpi n={report ? String(report.kpis.sessions) : "—"} l={t("progress.sessions")} />
        <Kpi n={report ? `${report.kpis.learningHours}h` : "—"} l={t("progress.learning")} />
        <Kpi n={report ? String(report.kpis.badges) : "—"} l={t("progress.badges")} />
      </div>

      <div className="desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:items-start">
        <div className="desktop:col-span-2 rounded-2xl p-4 md:p-5 bg-card border border-border/60 shadow-card">
          <div className="text-sm font-semibold mb-2">{t("progress.growthTitle")}</div>
          {report && report.growth.length > 0 ? (
            <ResponsiveContainer width="100%" height={140} className="md:!h-[200px]">
              <LineChart data={report.growth}>
                <defs><linearGradient id="lg" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#3082f6" /><stop offset="100%" stopColor="#07acff" /></linearGradient></defs>
                <XAxis dataKey="week" tick={{ fill: "#95a6be", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#0d1936", border: "none", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="url(#lg)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground py-8 text-center">{t("progress.noData")}</p>
          )}
        </div>

        <div className="mt-5 desktop:mt-0">
          <h2 className="font-bold mb-3">{t("progress.skills")}</h2>
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
        </div>
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
