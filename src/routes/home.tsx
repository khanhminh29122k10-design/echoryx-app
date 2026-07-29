import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, MessageCircle, Trophy, BarChart3, Sparkles, Tv, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { Stars } from "@/components/echoryx/Stars";
import tiger from "@/assets/tiger-mascot.png";
import { Logo } from "@/components/echoryx/Logo";
import { RequireAuth, useAuth } from "@/lib/auth";
import { devicesApi, rewardsApi, type Device } from "@/lib/api";

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
  const [starBalance, setStarBalance] = useState<number | null>(null);
  const [device, setDevice] = useState<Device | null>(null);

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
              <p className="text-xs text-muted-foreground">Hello, welcome back</p>
              <h1 className="text-xl font-bold">{activeChild ? `${activeChild.name}'s family` : `${parent?.name ?? "Your"} family`} 👋</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
              </button>
              <Link to="/profile" className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                {parent?.name?.charAt(0)?.toUpperCase() ?? "P"}
              </Link>
            </div>
          </header>

          <div className="relative mt-5 rounded-3xl p-5 gradient-primary shadow-glow overflow-hidden">
            <div className="relative z-10">
              <Logo className="w-24 mb-2" />
              <p className="text-primary-foreground/90 text-sm max-w-[190px] leading-snug">Turn every viewing moment into a chance to learn and connect.</p>
              <Link to="/conversation" className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-primary-foreground text-sm font-semibold">
                Start now <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <img src={tiger} alt="Tiger" className="absolute -right-4 -bottom-2 w-36 animate-float" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <Tile to="/parent" icon={<BarChart3 />} label="Dashboard" sub="Parent view" />
            <Tile to="/child" icon={<Tv />} label="Kid mode" sub="What's playing" />
            <Tile to="/characters" icon={<Sparkles />} label="Characters" sub="Choose favorite" />
            <Tile to="/rewards" icon={<Gift />} label="Rewards" sub={starBalance !== null ? `${starBalance} stars` : "…"} />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Quick actions</h2>
              <Link to="/analytics" className="text-xs text-primary-glow">See all</Link>
            </div>
            <div className="space-y-2">
              <Row to="/conversation" icon={<MessageCircle className="w-5 h-5" />} title="Talk to Niso" sub="AI conversation" />
              <Row to="/progress" icon={<Trophy className="w-5 h-5" />} title="Weekly progress" sub="See skills & growth" />
              <Row
                to="/devices"
                icon={<Tv className="w-5 h-5" />}
                title={device ? device.name : "No devices yet"}
                sub={device ? `${device.status === "connected" ? "Connected" : device.status}` : "Pair a device to get started"}
              />
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

function Row({ to, icon, title, sub }: any) {
  return (
    <Link to={to} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary-glow">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}
