import { createFileRoute } from "@tanstack/react-router";
import { Calendar, TrendingUp, Clock, Users, GraduationCap, Zap, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { RequireAuth, useAuth } from "@/lib/auth";
import { progressApi, type Dashboard } from "@/lib/api";
import { useT } from "@/lib/i18n";

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
  educational: "#3082f6",
  entertainment: "#07acff",
  other: "#384863",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function Parent() {
  const { activeChild } = useAuth();
  const t = useT();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeChild) return;
    progressApi.dashboard(activeChild.id, selectedDate).then(setDashboard).catch(() => undefined);
  }, [activeChild, selectedDate]);

  useEffect(() => {
    if (!pickerOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [pickerOpen]);

  const bars = dashboard
    ? Array.from({ length: 24 }, (_, h) => ({ t: String(h).padStart(2, "0"), v: dashboard.watchByHour[String(h).padStart(2, "0")] ?? 0 }))
    : [];
  const pie = dashboard
    ? [
        { name: t("dashboard.educational"), v: dashboard.contentMix.educational, c: PIE_COLORS.educational },
        { name: t("dashboard.entertainment"), v: dashboard.contentMix.entertainment, c: PIE_COLORS.entertainment },
        { name: t("dashboard.other"), v: dashboard.contentMix.other, c: PIE_COLORS.other },
      ]
    : [];
  const energyPct = dashboard && dashboard.energyBudgetMinutes > 0
    ? Math.min(100, Math.round((dashboard.energyUsedMinutes / dashboard.energyBudgetMinutes) * 100))
    : 0;

  const conversationsText =
    dashboard && dashboard.interactionsCount > 0
      ? t(dashboard.interactionsCount > 1 ? "dashboard.conversationsFmtPlural" : "dashboard.conversationsFmt", {
          name: activeChild?.name ?? t("dashboard.yourChild"),
          n: dashboard.interactionsCount,
        })
      : t("dashboard.noConversations");

  return (
    <MobileFrame>
      <ScreenHeader
        title={t("dashboard.title")}
        right={
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className={`w-10 h-10 rounded-xl bg-card border flex items-center justify-center ${selectedDate ? "border-primary text-primary" : "border-border"}`}
              aria-label="Pick a date"
            >
              <Calendar className="w-4 h-4" />
            </button>
            {pickerOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-card z-50 p-3">
                <label className="text-[11px] text-muted-foreground">{t("dashboard.pickDate")}</label>
                <input
                  type="date"
                  max={todayIso()}
                  value={selectedDate ?? todayIso()}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPickerOpen(false);
                  }}
                  className="mt-1.5 w-full px-3 py-2 rounded-xl bg-input/60 border border-border focus:border-primary outline-none text-xs"
                />
                {selectedDate && (
                  <button
                    onClick={() => {
                      setSelectedDate(undefined);
                      setPickerOpen(false);
                    }}
                    className="mt-2 text-[11px] text-primary-glow"
                  >
                    {t("dashboard.backToToday")}
                  </button>
                )}
              </div>
            )}
          </div>
        }
      />
      <p className="text-xs text-muted-foreground mb-4">{activeChild?.name ?? t("dashboard.noChild")} · {dashboard?.date ?? t("dashboard.today")}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Stat
          icon={<Clock className="w-4 h-4" />}
          iconBg="bg-primary/15"
          iconColor="text-primary"
          label={t("dashboard.totalWatchTime")}
          value={dashboard ? formatDuration(dashboard.totalWatchSeconds) : "—"}
        />
        <Stat
          icon={<Users className="w-4 h-4" />}
          iconBg="bg-success/15"
          iconColor="text-success"
          label={t("dashboard.interactions")}
          value={dashboard ? String(dashboard.interactionsCount) : "—"}
        />
        <Stat
          icon={<GraduationCap className="w-4 h-4" />}
          iconBg="bg-stat-purple/15"
          iconColor="text-stat-purple"
          label={t("dashboard.learningTime")}
          value={dashboard ? formatDuration(dashboard.learningSeconds) : "—"}
        />
        <div className="rounded-2xl p-4 md:p-5 bg-card border border-border/60 shadow-card">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-warning/15">
              <Zap className="w-4 h-4 text-warning" />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-[11px] text-muted-foreground mt-3">{t("dashboard.energyBudget")}</div>
          <div className="mt-1 relative w-16 h-16 mx-auto">
            <svg viewBox="0 0 36 36" className="w-16 h-16">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1a2846" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#3082f6"
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

      <div className="desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:items-start">
        <div className="desktop:col-span-2">
          <Card title={t("dashboard.watchByHour")}>
            <ResponsiveContainer width="100%" height={140} className="md:!h-[180px]">
              <BarChart data={bars}>
                <XAxis dataKey="t" tick={{ fill: "#95a6be", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Bar dataKey="v" radius={[6, 6, 0, 0]} fill="url(#g)" />
                <defs>
                  <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#07acff" />
                    <stop offset="100%" stopColor="#115bcd" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div>
          <Card title={t("dashboard.contentMix")}>
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
              <p className="text-xs text-muted-foreground">{t("dashboard.noWatchToday")}</p>
            )}
          </Card>
        </div>
      </div>

      <div className="rounded-2xl p-4 md:p-5 bg-card border border-border/60 shadow-card mt-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground"><TrendingUp className="w-5 h-5" /></div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{conversationsText}</div>
          <div className="text-[11px] text-muted-foreground">{t("dashboard.checkProgress")}</div>
        </div>
      </div>
      <BottomNav />
    </MobileFrame>
  );
}

function Stat({ icon, iconBg, iconColor, label, value }: any) {
  return (
    <div className="rounded-2xl p-4 md:p-5 bg-card border border-border/60 shadow-card">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="text-[11px] text-muted-foreground mt-3">{label}</div>
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
