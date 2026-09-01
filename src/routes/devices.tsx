import { createFileRoute } from "@tanstack/react-router";
import { Tv, Smartphone, Tablet, Plus, Wifi, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth } from "@/lib/auth";
import { devicesApi, type Device } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Devices · EchoRyx" },
      { name: "description", content: "Manage the TVs, tablets and phones connected to EchoRyx." },
      { property: "og:title", content: "Devices · EchoRyx" },
      { property: "og:description", content: "One family, every screen." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Devices />
    </RequireAuth>
  ),
});

const TYPE_ICON = { tv: Tv, tablet: Tablet, phone: Smartphone };

function Devices() {
  const t = useT();
  const [devices, setDevices] = useState<Device[]>([]);
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  function refresh() {
    devicesApi.list().then(setDevices).catch(() => undefined);
  }

  useEffect(refresh, []);

  async function createPairingCode() {
    setIsBusy(true);
    try {
      const result = await devicesApi.createPairingCode({ name: t("devices.newTv"), type: "tv" });
      setPairing({ code: result.pairingCode, expiresAt: result.expiresAt });
      refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function removeDevice(deviceId: string) {
    await devicesApi.remove(deviceId);
    refresh();
  }

  return (
    <MobileFrame>
      <ScreenHeader
        title={t("devices.title")}
        right={
          <button
            onClick={createPairingCode}
            disabled={isBusy}
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shadow-glow disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
          </button>
        }
      />

      {pairing && (
        <div className="mb-4 p-4 rounded-2xl bg-card border border-primary/40 shadow-glow relative">
          <button onClick={() => setPairing(null)} className="absolute top-3 right-3 text-muted-foreground"><X className="w-4 h-4" /></button>
          <div className="text-xs text-muted-foreground">{t("devices.pairingHint")}</div>
          <div className="text-3xl font-bold tracking-[0.3em] mt-2">{pairing.code}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{t("devices.expires", { time: new Date(pairing.expiresAt).toLocaleTimeString() })}</div>
        </div>
      )}

      {devices.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("devices.empty")}</p>
      ) : (
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 desktop:grid-cols-3 md:gap-4">
          {devices.map((d) => {
            const Ic = TYPE_ICON[d.type] ?? Tv;
            const isOnline = d.status === "connected";
            return (
              <div key={d.id} className="p-4 md:p-5 rounded-2xl bg-card border border-border/60 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground shrink-0"><Ic className="w-6 h-6" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-success" : "bg-muted-foreground"}`} /> {d.status}
                    </div>
                  </div>
                  <button onClick={() => removeDevice(d.id)} className="text-xs text-destructive font-semibold shrink-0">{t("devices.remove")}</button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                  <div><div className="text-foreground font-semibold text-xs">{d.appVersion ?? "—"}</div>{t("devices.firmware")}</div>
                  <div><div className="text-foreground font-semibold text-xs">{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleDateString() : "—"}</div>{t("devices.lastSeen")}</div>
                  <div className="flex items-center gap-1"><Wifi className={`w-3 h-3 ${isOnline ? "text-success" : "text-muted-foreground"}`} /><div><div className="text-foreground font-semibold text-xs">{d.platform}</div>{t("devices.platform")}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={createPairingCode} disabled={isBusy} className="mt-6 w-full md:w-auto md:px-8 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-glow flex items-center justify-center gap-2 disabled:opacity-60">
        <Plus className="w-4 h-4" /> {t("devices.pairNew")}
      </button>
      <BottomNav />
    </MobileFrame>
  );
}
