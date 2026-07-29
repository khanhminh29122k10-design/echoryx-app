import { createFileRoute } from "@tanstack/react-router";
import { Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import tiger from "@/assets/tiger-mascot.png";
import { RequireAuth, useAuth } from "@/lib/auth";
import { ensureDeviceToken, watchSessionsApi, type WatchSession } from "@/lib/api";

export const Route = createFileRoute("/child")({
  head: () => ({
    meta: [
      { title: "Now watching · EchoRyx" },
      { name: "description", content: "See what your child is watching and learning right now." },
      { property: "og:title", content: "Now watching · EchoRyx" },
      { property: "og:description", content: "Live view of your child's screen time." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Child />
    </RequireAuth>
  ),
});

const DEMO_SHOWS = [
  { sourceApp: "youtube", contentTitle: "Peppa Pig · Ep 15", category: "entertainment" as const },
  { sourceApp: "youtube", contentTitle: "Wild Animals", category: "educational" as const },
  { sourceApp: "netflix", contentTitle: "Baby Shark", category: "entertainment" as const },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Child() {
  const { activeChild } = useAuth();
  const [current, setCurrent] = useState<WatchSession | null>(null);
  const [history, setHistory] = useState<WatchSession[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  async function refresh() {
    if (!activeChild) return;
    const [curr, hist] = await Promise.all([
      watchSessionsApi.current(activeChild.id).catch(() => null),
      watchSessionsApi.history(activeChild.id).catch(() => []),
    ]);
    setCurrent(curr);
    setHistory(hist);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild]);

  async function startWatching() {
    if (!activeChild) return;
    setIsBusy(true);
    try {
      await ensureDeviceToken();
      const show = DEMO_SHOWS[Math.floor(Math.random() * DEMO_SHOWS.length)];
      await watchSessionsApi.start({ childId: activeChild.id, ...show });
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function endWatching() {
    if (!current) return;
    setIsBusy(true);
    try {
      await watchSessionsApi.end(current.id);
      await refresh();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <MobileFrame>
      <ScreenHeader title="Now watching" />

      <div className="rounded-3xl overflow-hidden bg-card border border-border/60 shadow-card">
        <div className="relative h-40 gradient-primary flex items-center justify-center">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_40%,white,transparent_60%)]" />
          <img src={tiger} alt="Show" className="relative h-32 animate-float" />
          {!current && (
            <button
              onClick={startWatching}
              disabled={isBusy || !activeChild}
              className="absolute inset-0 flex items-center justify-center disabled:opacity-60"
            >
              <span className="w-14 h-14 rounded-full bg-white/25 backdrop-blur flex items-center justify-center animate-pulse-ring">
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
              </span>
            </button>
          )}
        </div>
        <div className="p-4">
          {current ? (
            <>
              <div className="font-bold">{current.contentTitle ?? current.sourceApp}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{current.sourceApp} · {current.category}</div>
              <div className="text-xs text-muted-foreground">Started at {formatTime(current.startedAt)}</div>
              <button
                onClick={endWatching}
                disabled={isBusy}
                className="mt-3 w-full py-2.5 rounded-xl bg-secondary border border-border font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Square className="w-3.5 h-3.5" /> End watching
              </button>
            </>
          ) : (
            <>
              <div className="font-semibold text-sm">Nothing playing right now</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                No Android companion app connected yet — tap play above to simulate a watch session for this demo.
              </div>
            </>
          )}
        </div>
      </div>

      <h2 className="font-bold mt-6 mb-3">Watch history</h2>
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">No watch sessions recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60">
              <div className="w-12 h-12 rounded-xl gradient-primary" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{h.contentTitle ?? h.sourceApp}</div>
                <div className="text-[11px] text-muted-foreground">{h.sourceApp}</div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {formatTime(h.startedAt)}{h.endedAt ? ` - ${formatTime(h.endedAt)}` : " (ongoing)"}
              </div>
            </li>
          ))}
        </ul>
      )}
      <BottomNav />
    </MobileFrame>
  );
}
