import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, Clock, Globe, Lock, Monitor, Info, LogOut, ChevronRight, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth, useAuth } from "@/lib/auth";
import { devicesApi, childrenApi, settingsApi, type AppSettings } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · EchoRyx" },
      { name: "description", content: "Configure EchoRyx to fit your family." },
      { property: "og:title", content: "Settings · EchoRyx" },
      { property: "og:description", content: "Privacy, time limits, language and more." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  ),
});

function Settings() {
  const { activeChild, logout } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    devicesApi.list().then((d) => setDeviceCount(d.length)).catch(() => undefined);
    settingsApi.get().then(setAppSettings).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeChild) return;
    childrenApi.getFrequency(activeChild.id).then((f) => setIntervalMinutes(f.intervalMinutes)).catch(() => undefined);
  }, [activeChild]);

  const enabledNotifCount = appSettings ? Object.values(appSettings.notificationPrefs).filter(Boolean).length : null;

  const groups = [
    { title: t("settings.groupFamily"), items: [
      { icon: Monitor, name: t("settings.deviceManagement"), to: "/devices", sub: deviceCount !== null ? t(deviceCount === 1 ? "settings.deviceCountFmt" : "settings.deviceCountFmtPlural", { n: deviceCount }) : "…" },
      { icon: Lock, name: t("settings.privacy"), to: "/privacy", sub: appSettings ? (appSettings.hasPin ? t("settings.privacyPinSet") : t("settings.privacySub")) : "…" },
      { icon: Clock, name: t("settings.timeLimits"), sub: t("settings.comingSoon") },
    ]},
    { title: t("settings.groupExperience"), items: [
      { icon: Tv, name: t("settings.interactionFrequency"), to: "/frequency", sub: intervalMinutes !== null ? (intervalMinutes === 0 ? t("settings.off") : t("settings.every", { n: intervalMinutes })) : "…" },
      { icon: Globe, name: t("settings.language"), to: "/language", sub: appSettings ? (appSettings.locale === "vi" ? "Tiếng Việt" : "English") : "…" },
      { icon: Bell, name: t("settings.notifications"), to: "/notification-preferences", sub: enabledNotifCount !== null ? t("settings.notificationsOnFmt", { n: enabledNotifCount }) : "…" },
    ]},
    { title: t("settings.groupAbout"), items: [
      { icon: Info, name: t("settings.appInfo"), sub: "v0.1.0" },
    ]},
  ];

  async function handleSignOut() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <MobileFrame>
      <ScreenHeader title={t("settings.title")} />
      <div className="md:grid md:grid-cols-2 desktop:grid-cols-3 md:gap-5 md:items-start">
        {groups.map((g) => (
          <div key={g.title} className="mb-5 md:mb-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground ml-2 mb-2">{g.title}</div>
            <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
              {g.items.map((it, i) => {
                const Ic = it.icon;
                const inner = (
                  <div className={`flex items-center gap-3 p-4 ${i > 0 ? "border-t border-border/50" : ""}`}>
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary-glow shrink-0"><Ic className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{it.name}</div>
                      <div className="text-[11px] text-muted-foreground">{it.sub}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                );
                return "to" in it && it.to ? <Link key={it.name} to={it.to}>{inner}</Link> : <div key={it.name}>{inner}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleSignOut} className="w-full md:w-auto md:px-10 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-destructive/10 text-destructive font-semibold border border-destructive/30">
        <LogOut className="w-4 h-4" /> {t("settings.signOut")}
      </button>
      <BottomNav />
    </MobileFrame>
  );
}
