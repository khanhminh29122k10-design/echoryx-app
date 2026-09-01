import { useEffect, useRef, useState } from "react";
import { Bell, Trophy, Gift, Zap, BarChart3, Sparkles, X } from "lucide-react";
import { notificationsApi, type Notification } from "@/lib/api";
import { useT } from "@/lib/i18n";

const TYPE_ICON: Record<string, React.ReactNode> = {
  milestone: <Sparkles className="w-4 h-4" />,
  badge_earned: <Trophy className="w-4 h-4" />,
  redemption_requested: <Gift className="w-4 h-4" />,
  energy_budget_reached: <Zap className="w-4 h-4" />,
  weekly_report: <BarChart3 className="w-4 h-4" />,
};

function useTimeAgo() {
  const t = useT();
  return (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t("bell.justNow");
    if (mins < 60) return t("bell.minutesAgo", { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("bell.hoursAgo", { n: hours });
    const days = Math.floor(hours / 24);
    return t("bell.daysAgo", { n: days });
  };
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const timeAgo = useTimeAgo();

  useEffect(() => {
    notificationsApi
      .list()
      .then((list) => {
        setItems(list);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function handleItemClick(n: Notification) {
    if (n.isRead) return;
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
    try {
      await notificationsApi.markRead(n.id);
    } catch {
      // non-fatal — worst case it shows unread again after a refetch
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-card border border-border flex items-center justify-center relative"
        aria-label={t("bell.title")}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[85vw] rounded-2xl bg-card border border-border shadow-card z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="font-semibold text-sm">{t("bell.title")}</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!loaded && <p className="px-4 py-6 text-xs text-muted-foreground text-center">{t("bell.loading")}</p>}
            {loaded && items.length === 0 && (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">{t("bell.empty")}</p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-b-0 transition hover:bg-secondary/50 ${
                  n.isRead ? "opacity-60" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary-glow flex-shrink-0 mt-0.5">
                  {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate">{n.title}</span>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
