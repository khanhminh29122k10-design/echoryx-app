import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, Trophy, BarChart3, Sparkles, Tv, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { Stars } from "@/components/echoryx/Stars";
import { NotificationBell } from "@/components/echoryx/NotificationBell";
import { Switch } from "@/components/ui/switch";
import tiger from "@/assets/tiger-mascot.png";
import { Logo } from "@/components/echoryx/Logo";
import { RequireAuth, useAuth } from "@/lib/auth";
import { devicesApi, rewardsApi, type Device } from "@/lib/api";
import { getExtensionTracking, setExtensionTracking } from "@/lib/extensionBridge";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home · EchoRyx" },
      { name: "description", content: "Your EchoRyx family home — quick access to characters, activities, and today's learning." },
      { property: "og:title", content: "Home · EchoRyx" },
      { property: "og:description", content: "Turn screen time into learning time." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Home />
    </RequireAuth>
  ),
});

function Home() {
  const { parent, activeChild } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [starBalance, setStarBalance] = useState<number | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [aiActivated, setAiActivated] = useState(false);

  useEffect(() => {
    getExtensionTracking().then((enabled) => {
      if (enabled !== null) setAiActivated(enabled);
    });
  }, []);

  useEffect(() => {
    if (!activeChild) return;
    rewardsApi
      .summary(activeChild.id)
      .then((r) => setStarBalance(r.starBalance))
      .catch(() => undefined);
    devicesApi
      .list()
      .then((devs) => setDevice(devs[0] ?? null))
      .catch(() => undefined);
  }, [activeChild]);

  useEffect(() => {
    if (activeChild === null && parent) {
      navigate({ to: "/characters" });
    }
  }, [activeChild, parent, navigate]);

  return (
    <MobileFrame>
      <div className="relative">
        <Stars />
        <div className="relative">
          <header className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">{t("home.hello")}</p>
              <h1 className="text-xl md:text-2xl desktop:text-3xl font-bold">
                {activeChild ? t("home.familyTitle", { name: activeChild.name }) : t("home.familyTitle", { name: parent?.name ?? t("home.yourFamily") })} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <NotificationBell />
              <Link to="/profile" className="w-10 h-10 md:w-11 md:h-11 rounded-xl gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                {parent?.name?.charAt(0)?.toUpperCase() ?? "P"}
              </Link>
            </div>
          </header>

          <div className="relative mt-5 md:mt-6 rounded-3xl p-5 md:p-8 desktop:p-10 gradient-primary shadow-glow overflow-hidden">
            <div className="relative z-10">
              <Logo className="w-24 md:w-28 mb-2" />
              <p className="text-primary-foreground/90 text-sm md:text-base max-w-[190px] md:max-w-xs leading-snug">{t("home.tagline")}</p>
              <div className="inline-flex items-center gap-2.5 mt-4 pl-4 pr-3.5 py-2 rounded-full bg-white/20 backdrop-blur">
                <span className="inline-flex items-center gap-1.5 text-primary-foreground text-sm font-semibold">
                  {aiActivated ? (
                    <>
                      <Check className="w-4 h-4" /> {t("home.aiOn")}
                    </>
                  ) : (
                    <>
                      {t("home.startNow")} <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </span>
                <Switch
                  checked={aiActivated}
                  onCheckedChange={(checked) => {
                    setExtensionTracking(checked);
                    setAiActivated(checked);
                  }}
                  aria-label="Toggle Niso's AI mode on YouTube"
                  className="data-[state=checked]:bg-emerald-400 data-[state=unchecked]:bg-white/30"
                />
              </div>
            </div>
            <img src={tiger} alt="Tiger" className="absolute -right-4 -bottom-2 md:right-4 md:w-44 desktop:w-52 w-36 animate-float" />
          </div>

          <div className="desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:items-start mt-5 md:mt-6">
            <div className="desktop:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Tile to="/parent" icon={<BarChart3 />} label={t("home.dashboard")} sub={t("home.dashboardSub")} />
                <Tile to="/child" icon={<Tv />} label={t("home.kidMode")} sub={t("home.kidModeSub")} />
                <Tile to="/characters" icon={<Sparkles />} label={t("home.characters")} sub={t("home.charactersSub")} />
                <Tile to="/rewards" icon={<Gift />} label={t("home.rewards")} sub={starBalance !== null ? t("home.starsFmt", { n: starBalance }) : "…"} />
              </div>
            </div>

            <div className="mt-6 desktop:mt-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold">{t("home.quickActions")}</h2>
                <Link to="/analytics" className="text-xs text-primary-glow">{t("home.seeAll")}</Link>
              </div>
              <div className="space-y-2">
                <Row to="/progress" icon={<Trophy className="w-5 h-5" />} title={t("home.weeklyProgress")} sub={t("home.weeklyProgressSub")} />
                <Row
                  to="/devices"
                  icon={<Tv className="w-5 h-5" />}
                  title={device ? device.name : t("home.noDevices")}
                  sub={device ? (device.status === "connected" ? t("home.connected") : device.status) : t("home.pairDevice")}
                />
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    </MobileFrame>
  );
}

function Tile({ to, icon, label, sub }: any) {
  return (
    <Link to={to} className="rounded-2xl p-4 bg-card border border-border/60 hover:border-primary/40 transition shadow-card">
      <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground mb-2 [&>svg]:w-5 [&>svg]:h-5">{icon}</div>
      <div className="font-semibold text-sm">{label}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </Link>
  );
}

function Row({ to, icon, title, sub, onClick }: any) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary-glow">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}
