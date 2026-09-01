import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { RequireAuth, useAuth } from "@/lib/auth";
import { progressApi, type WeeklyAnalytics } from "@/lib/api";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Weekly analytics · EchoRyx" },
      { name: "description", content: "Deep-dive into the week of screen time and learning." },
      { property: "og:title", content: "Weekly analytics · EchoRyx" },
      { property: "og:description", content: "Numbers behind the smiles." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Analytics />
    </RequireAuth>
  ),
});

const periodKeys: TranslationKey[] = ["analytics.week", "analytics.month", "analytics.year"];

function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Analytics() {
  const { activeChild } = useAuth();
  const t = useT();
  const [data, setData] = useState<WeeklyAnalytics | null>(null);

  useEffect(() => {
    if (!activeChild) return;
    progressApi.weeklyAnalytics(activeChild.id).then(setData).catch(() => undefined);
  }, [activeChild]);

  const categoryRows: [TranslationKey, number][] = data
    ? [
        ["analytics.educational", data.categories.educational],
        ["analytics.entertainment", data.categories.entertainment],
        ["analytics.other", data.categories.other],
      ]
    : [];

  const change = data?.percentChangeVsPreviousWeek ?? null;

  return (
    <MobileFrame>
      <ScreenHeader title={t("analytics.title")} />
      <div className="flex gap-2 mb-4">
        {periodKeys.map((key, i) => (
          <button key={key} className={`flex-1 py-2 rounded-xl text-xs font-semibold ${i===0 ? "gradient-primary text-primary-foreground shadow-glow" : "bg-card border border-border"}`}>{t(key)}</button>
        ))}
      </div>

      <div className="desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:items-start">
        <div className="desktop:col-span-2 rounded-2xl p-4 md:p-5 bg-card border border-border/60 shadow-card">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs text-muted-foreground">{t("analytics.totalThisWeek")}</div>
              <div className="text-2xl font-bold">{data ? formatDuration(data.totalWatchSeconds) : "—"}</div>
            </div>
            {change !== null && (
              <div className={`text-xs ${change >= 0 ? "text-success" : "text-destructive"}`}>
                {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
              </div>
            )}
          </div>
          {data && data.days.some((d) => d.watch > 0 || d.learn > 0) ? (
            <ResponsiveContainer width="100%" height={160} className="md:!h-[200px]">
              <AreaChart data={data.days}>
                <defs>
                  <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3082f6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#3082f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fill: "#95a6be", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#0d1936", border: "none", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="watch" stroke="#3082f6" strokeWidth={2} fill="url(#ag)" />
                <Area type="monotone" dataKey="learn" stroke="#00c470" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground py-8 text-center">{t("analytics.noData")}</p>
          )}
          <div className="flex gap-4 text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> {t("analytics.watchTime")}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> {t("analytics.learning")}</span>
          </div>
        </div>

        <div className="mt-5 desktop:mt-0">
          <h2 className="font-bold mb-3">{t("analytics.topCategories")}</h2>
          <div className="space-y-2">
            {categoryRows.map(([key, v]) => (
              <div key={key} className="p-3 rounded-2xl bg-card border border-border/60">
                <div className="flex justify-between text-xs mb-2"><span>{t(key)}</span><span className="font-semibold">{v}%</span></div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full gradient-primary" style={{ width: `${v}%` }} />
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
