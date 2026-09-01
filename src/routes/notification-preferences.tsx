import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Trophy, Gift, Zap, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { Switch } from "@/components/ui/switch";
import { RequireAuth } from "@/lib/auth";
import { settingsApi, type NotificationPrefs } from "@/lib/api";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/notification-preferences")({
  head: () => ({
    meta: [
      { title: "Notifications · EchoRyx" },
      { name: "description", content: "Choose which updates EchoRyx sends you." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NotificationPreferences />
    </RequireAuth>
  ),
});

const ROWS: { key: keyof NotificationPrefs; icon: React.ReactNode; titleKey: TranslationKey; subKey: TranslationKey }[] = [
  { key: "milestone", icon: <Sparkles className="w-4 h-4" />, titleKey: "notifPrefs.milestone", subKey: "notifPrefs.milestoneSub" },
  { key: "badge_earned", icon: <Trophy className="w-4 h-4" />, titleKey: "notifPrefs.badge", subKey: "notifPrefs.badgeSub" },
  { key: "redemption_requested", icon: <Gift className="w-4 h-4" />, titleKey: "notifPrefs.redemption", subKey: "notifPrefs.redemptionSub" },
  { key: "energy_budget_reached", icon: <Zap className="w-4 h-4" />, titleKey: "notifPrefs.energy", subKey: "notifPrefs.energySub" },
  { key: "weekly_report", icon: <BarChart3 className="w-4 h-4" />, titleKey: "notifPrefs.weekly", subKey: "notifPrefs.weeklySub" },
];

function NotificationPreferences() {
  const t = useT();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.get().then((s) => setPrefs(s.notificationPrefs)).catch(() => undefined);
  }, []);

  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: value }); // optimistic
    setSaving(key);
    try {
      const updated = await settingsApi.updateNotificationPrefs({ [key]: value });
      setPrefs(updated);
    } catch {
      setPrefs((p) => (p ? { ...p, [key]: !value } : p)); // revert on failure
    } finally {
      setSaving(null);
    }
  }

  return (
    <MobileFrame>
      <div className="md:max-w-lg md:mx-auto">
        <ScreenHeader title={t("notifPrefs.title")} back="/settings" />
        <p className="text-xs text-muted-foreground mb-4">{t("notifPrefs.subtitle")}</p>

        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
          {ROWS.map((row, i) => (
            <div key={row.key} className={`flex items-center gap-3 p-4 ${i > 0 ? "border-t border-border/50" : ""}`}>
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary-glow shrink-0">{row.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{t(row.titleKey)}</div>
                <div className="text-[11px] text-muted-foreground">{t(row.subKey)}</div>
              </div>
              <Switch
                checked={prefs?.[row.key] ?? true}
                disabled={!prefs || saving === row.key}
                onCheckedChange={(checked) => toggle(row.key, checked)}
                aria-label={`Toggle ${t(row.titleKey)} notifications`}
              />
            </div>
          ))}
        </div>
      </div>
    </MobileFrame>
  );
}
