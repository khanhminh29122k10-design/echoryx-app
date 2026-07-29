import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, Clock, Globe, Lock, Monitor, Info, LogOut, ChevronRight, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth, useAuth } from "@/lib/auth";
import { devicesApi, childrenApi } from "@/lib/api";

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
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState<number | null>(null);

  useEffect(() => {
    devicesApi.list().then((d) => setDeviceCount(d.length)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeChild) return;
    childrenApi.getFrequency(activeChild.id).then((f) => setIntervalMinutes(f.intervalMinutes)).catch(() => undefined);
  }, [activeChild]);

  const groups = [
    { title: "Family", items: [
      { icon: Monitor, name: "Device management", to: "/devices", sub: deviceCount !== null ? `${deviceCount} device${deviceCount === 1 ? "" : "s"}` : "…" },
      { icon: Lock, name: "Privacy", sub: "PIN, data" },
      { icon: Clock, name: "Time limits", sub: "Coming soon" },
    ]},
    { title: "Experience", items: [
      { icon: Tv, name: "Interaction frequency", to: "/frequency", sub: intervalMinutes !== null ? (intervalMinutes === 0 ? "Off" : `Every ${intervalMinutes} min`) : "…" },
      { icon: Globe, name: "Language", sub: "English" },
      { icon: Bell, name: "Notifications", sub: "On" },
    ]},
    { title: "About", items: [
      { icon: Info, name: "App info", sub: "v0.1.0" },
    ]},
  ];

  async function handleSignOut() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <MobileFrame>
      <ScreenHeader title="Settings" />
      {groups.map((g) => (
        <div key={g.title} className="mb-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground ml-2 mb-2">{g.title}</div>
          <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
            {g.items.map((it, i) => {
              const Ic = it.icon;
              const inner = (
                <div className={`flex items-center gap-3 p-4 ${i > 0 ? "border-t border-border/50" : ""}`}>
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary-glow"><Ic className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{it.name}</div>
                    <div className="text-[11px] text-muted-foreground">{it.sub}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              );
              return it.to ? <Link key={it.name} to={it.to}>{inner}</Link> : <div key={it.name}>{inner}</div>;
            })}
          </div>
        </div>
      ))}
      <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-destructive/10 text-destructive font-semibold border border-destructive/30">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
      <BottomNav />
    </MobileFrame>
  );
}
