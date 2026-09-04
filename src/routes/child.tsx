import { createFileRoute } from "@tanstack/react-router";
import { Play, Square, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { characters as characterAssets, tiger } from "@/components/echoryx/data";
import { RequireAuth, useAuth } from "@/lib/auth";
import { ensureDeviceToken, watchSessionsApi, charactersApi, childrenApi, type WatchSession, type Character } from "@/lib/api";
import { useT } from "@/lib/i18n";

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
  const { activeChild, refreshChildren } = useAuth();
  const t = useT();
  const [current, setCurrent] = useState<WatchSession | null>(null);
  const [history, setHistory] = useState<WatchSession[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [remoteCharacters, setRemoteCharacters] = useState<Character[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingCharacter, setSavingCharacter] = useState<string | null>(null);

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

  useEffect(() => {
    charactersApi.list().then(setRemoteCharacters).catch(() => undefined);
  }, []);

  // Local (bundled) character assets are keyed by "code" (e.g. "tiger"), matching the
  // backend Character's `code` field — the same mapping characters.tsx uses when creating a
  // child. The child's own `characterId` is the backend Character's id, so we hop through
  // remoteCharacters to find the matching local asset for the mascot image.
  const currentRemote = remoteCharacters.find((c) => c.id === activeChild?.characterId);
  const currentAsset = characterAssets.find((c) => c.id === currentRemote?.code);
  const mascotImg = currentAsset?.img ?? tiger;

  async function changeCharacter(code: string) {
    if (!activeChild) return;
    const remote = remoteCharacters.find((c) => c.code === code);
    if (!remote) return;
    setSavingCharacter(code);
    try {
      await childrenApi.update(activeChild.id, { characterId: remote.id });
      await refreshChildren();
      setPickerOpen(false);
    } catch {
      // Non-fatal — the picker just stays open so the parent can retry.
    } finally {
      setSavingCharacter(null);
    }
  }

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
      <ScreenHeader title={t("child.title")} />

      <div className="desktop:grid desktop:grid-cols-5 desktop:gap-6 desktop:items-start">
        <div className="desktop:col-span-2 rounded-3xl overflow-hidden bg-card border border-border/60 shadow-card">
          <div className="relative h-40 md:h-48 gradient-primary flex items-center justify-center">
            <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_40%,white,transparent_60%)]" />
            <img src={mascotImg} alt="Show" className="relative h-32 md:h-36 animate-float" />
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
          <div className="p-4 md:p-5">
            {current ? (
              <>
                <div className="font-bold">{current.contentTitle ?? current.sourceApp}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{current.sourceApp} · {current.category}</div>
                <div className="text-xs text-muted-foreground">{t("child.startedAt", { time: formatTime(current.startedAt) })}</div>
                <button
                  onClick={endWatching}
                  disabled={isBusy}
                  className="mt-3 w-full py-2.5 rounded-xl bg-secondary border border-border font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Square className="w-3.5 h-3.5" /> {t("child.endWatching")}
                </button>
              </>
            ) : (
              <>
                <div className="font-semibold text-sm">{t("child.nothingPlaying")}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t("child.noCompanion")}</div>
              </>
            )}
          </div>
        </div>

        <div className="desktop:col-span-2">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="mt-3 w-full py-2.5 rounded-xl bg-card border border-border/60 font-semibold text-sm hover:border-primary transition"
          >
            {t("child.changeCharacter")}
          </button>
          {pickerOpen && (
            <div className="mt-3 grid grid-cols-4 gap-2 p-3 rounded-2xl bg-card border border-border/60">
              {characterAssets.map((c) => {
                const isActive = c.id === currentAsset?.id;
                const isSaving = savingCharacter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => changeCharacter(c.id)}
                    disabled={isSaving}
                    className={`relative rounded-xl p-2 bg-secondary border transition disabled:opacity-60 ${isActive ? "border-primary shadow-glow" : "border-border/60"}`}
                  >
                    {isActive && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full gradient-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </span>
                    )}
                    <img src={c.img} alt={c.name} className="h-12 w-full object-contain" />
                    <div className="mt-1 text-[10px] text-center text-muted-foreground truncate">{c.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="desktop:col-span-3 mt-6 desktop:mt-0">
          <h2 className="font-bold mb-3">{t("child.watchHistory")}</h2>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("child.noHistory")}</p>
          ) : (
            <ul className="space-y-2 md:grid md:grid-cols-2 desktop:grid-cols-1 md:gap-2 md:space-y-0">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60">
                  <div className="w-12 h-12 rounded-xl gradient-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{h.contentTitle ?? h.sourceApp}</div>
                    <div className="text-[11px] text-muted-foreground">{h.sourceApp}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground text-right shrink-0">
                    {formatTime(h.startedAt)}{h.endedAt ? ` - ${formatTime(h.endedAt)}` : ` ${t("child.ongoing")}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <BottomNav />
    </MobileFrame>
  );
}
