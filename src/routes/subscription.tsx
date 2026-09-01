import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth } from "@/lib/auth";
import { settingsApi, type Plan } from "@/lib/api";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/subscription")({
  head: () => ({
    meta: [
      { title: "Subscription · EchoRyx" },
      { name: "description", content: "Compare EchoRyx's Free, Plus and Premium plans." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Subscription />
    </RequireAuth>
  ),
});

const PLANS: { id: Plan; nameKey: TranslationKey; price: string; features: TranslationKey[]; recommended?: boolean }[] = [
  { id: "free", nameKey: "subscription.free", price: "$0", features: ["subscription.freeFeature1", "subscription.freeFeature2", "subscription.freeFeature3", "subscription.freeFeature4"] },
  { id: "plus", nameKey: "subscription.plus", price: "$3.63", features: ["subscription.plusFeature1", "subscription.plusFeature2", "subscription.plusFeature3", "subscription.plusFeature4"], recommended: true },
  { id: "premium", nameKey: "subscription.premium", price: "$13.56", features: ["subscription.premiumFeature1", "subscription.premiumFeature2", "subscription.premiumFeature3"] },
];

function Subscription() {
  const t = useT();
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState<Plan | null>(null);

  useEffect(() => {
    settingsApi.get().then((s) => setCurrentPlan(s.plan)).catch(() => undefined);
  }, []);

  async function choose(plan: Plan) {
    setBusy(plan);
    try {
      await settingsApi.updatePlan(plan);
      setCurrentPlan(plan);
    } finally {
      setBusy(null);
    }
  }

  return (
    <MobileFrame>
      <div className="md:max-w-4xl md:mx-auto">
        <ScreenHeader title={t("subscription.title")} back="/profile" />
        <p className="text-xs md:text-sm text-muted-foreground mb-5 text-center">{t("subscription.subtitle")}</p>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-5 border flex flex-col ${
                  plan.recommended ? "gradient-primary shadow-glow border-transparent" : "bg-card border-border/60"
                }`}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-warning text-[10px] font-bold text-background">
                    {t("subscription.recommended")}
                  </span>
                )}
                <div className={`text-xs font-bold uppercase tracking-wider ${plan.recommended ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {t(plan.nameKey)}
                </div>
                <div className={`text-3xl font-bold mt-1 ${plan.recommended ? "text-primary-foreground" : ""}`}>
                  {plan.price}
                  <span className={`text-sm font-normal ${plan.recommended ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t("subscription.perMonth")}</span>
                </div>
                <div className={`h-px my-4 ${plan.recommended ? "bg-white/20" : "bg-border"}`} />
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-xs ${plan.recommended ? "text-primary-foreground/90" : "text-foreground"}`}>
                      <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.recommended ? "text-primary-foreground" : "text-success"}`} />
                      {t(f)}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => choose(plan.id)}
                  disabled={isCurrent || busy !== null}
                  className={`mt-5 w-full py-2.5 rounded-xl font-semibold text-xs disabled:opacity-70 ${
                    plan.recommended
                      ? "bg-white text-primary"
                      : "bg-secondary text-foreground border border-border"
                  }`}
                >
                  {isCurrent ? t("subscription.currentPlan") : busy === plan.id ? "…" : t("subscription.selectPlan")}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">{t("subscription.demoNotice")}</p>
      </div>
    </MobileFrame>
  );
}
