import { createFileRoute } from "@tanstack/react-router";
import { Gift, Star, Trophy, Lock, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth, useAuth } from "@/lib/auth";
import { rewardsApi, ApiError, type RewardsSummary, type RewardItem, type Redemption } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards · EchoRyx" },
      { name: "description", content: "Celebrate every learning milestone." },
      { property: "og:title", content: "Rewards · EchoRyx" },
      { property: "og:description", content: "Stars, badges and streaks." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Rewards />
    </RequireAuth>
  ),
});

function Rewards() {
  const { activeChild } = useAuth();
  const t = useT();
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [items, setItems] = useState<RewardItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!activeChild) return;
    const [s, i, r] = await Promise.all([
      rewardsApi.summary(activeChild.id),
      rewardsApi.items(),
      rewardsApi.redemptions(activeChild.id),
    ]);
    setSummary(s);
    setItems(i);
    setRedemptions(r);
  }

  useEffect(() => {
    refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild]);

  async function redeem(itemId: string) {
    if (!activeChild) return;
    setError(null);
    try {
      await rewardsApi.redeem(activeChild.id, itemId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("rewards.redeemError"));
    }
  }

  async function decide(redemptionId: string, decision: "approved" | "rejected") {
    await rewardsApi.decide(redemptionId, decision);
    await refresh();
  }

  const nextBadge = summary?.badges.find((b) => !b.earned);
  const pending = redemptions.filter((r) => r.status === "pending");
  const balance = summary?.starBalance ?? 0;

  return (
    <MobileFrame>
      <ScreenHeader title={t("rewards.title")} right={<Trophy className="w-5 h-5 text-warning" />} />

      <div className="relative rounded-3xl p-5 gradient-primary shadow-glow overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-20">
          <Gift className="w-32 h-32 text-white" />
        </div>
        <div className="text-primary-foreground/80 text-xs">{t("rewards.starBalance")}</div>
        <div className="text-primary-foreground text-4xl font-bold flex items-center gap-2 mt-1">
          {balance} <Star className="w-6 h-6 fill-warning text-warning" />
        </div>
        {nextBadge && (
          <div className="text-primary-foreground/80 text-[11px] mt-4">{t("rewards.nextUp", { name: nextBadge.name, description: nextBadge.description })}</div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="mt-4">
          <h2 className="font-bold mb-2 text-sm">{t("rewards.pendingApproval")}</h2>
          <div className="space-y-2">
            {pending.map((r) => {
              const item = items.find((i) => i.id === r.rewardItemId);
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-warning/40">
                  <div className="flex-1 text-sm font-semibold">{item?.name ?? t("rewards.reward")} — {r.costStars} ⭐</div>
                  <button onClick={() => decide(r.id, "approved")} className="text-xs font-semibold text-success">{t("rewards.approve")}</button>
                  <button onClick={() => decide(r.id, "rejected")} className="text-xs font-semibold text-destructive">{t("rewards.reject")}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="desktop:grid desktop:grid-cols-2 desktop:gap-8 desktop:items-start">
        <div>
          <h2 className="font-bold mt-6 mb-3">{t("rewards.badges")}</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 desktop:grid-cols-3 gap-3 md:gap-4">
            {(summary?.badges ?? []).map((b) => (
              <div key={b.id} className={`rounded-2xl p-3 bg-card border border-border/60 text-center ${!b.earned && "opacity-60"}`}>
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${b.earned ? "gradient-primary shadow-glow" : "bg-secondary"}`}>
                  {b.earned ? <Trophy className="w-6 h-6 text-primary-foreground" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="text-[11px] font-semibold mt-2">{b.name}</div>
                <div className="text-[10px] text-muted-foreground">{b.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bold mt-6 desktop:mt-6 mb-3">{t("rewards.redeemSection")}</h2>
          {error && <p className="text-xs text-destructive mb-2">{error}</p>}
          <div className="space-y-2 md:grid md:grid-cols-2 desktop:grid-cols-1 md:gap-2 md:space-y-0">
            {items.map((item) => {
              const alreadyPending = pending.some((r) => r.rewardItemId === item.id);
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0"><Gift className="w-5 h-5 text-primary-glow" /></div>
                  <div className="flex-1 min-w-0 text-sm font-semibold truncate">{item.name}</div>
                  <span className="text-xs font-bold flex items-center gap-1 shrink-0">{item.costStars} <Star className="w-3 h-3 fill-warning text-warning" /></span>
                  {alreadyPending ? (
                    <Check className="w-4 h-4 text-warning shrink-0" />
                  ) : (
                    <button
                      onClick={() => redeem(item.id)}
                      disabled={balance < item.costStars}
                      className="text-xs font-semibold text-primary-glow disabled:text-muted-foreground disabled:opacity-60 shrink-0"
                    >
                      {t("rewards.redeem")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </MobileFrame>
  );
}
