import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Clock, Sparkles, Power } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth, useAuth } from "@/lib/auth";
import { childrenApi } from "@/lib/api";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/frequency")({
  head: () => ({
    meta: [
      { title: "Interaction frequency · EchoRyx" },
      { name: "description", content: "Choose how often Niso chimes in during shows." },
      { property: "og:title", content: "Interaction frequency · EchoRyx" },
      { property: "og:description", content: "Tune the rhythm of learning prompts." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Freq />
    </RequireAuth>
  ),
});

const opts: { m: number; labelKey: TranslationKey | null; subKey: TranslationKey; rec?: boolean }[] = [
  { m: 5, labelKey: null, subKey: "frequency.veryFrequent" },
  { m: 10, labelKey: null, subKey: "frequency.frequent", rec: true },
  { m: 20, labelKey: null, subKey: "frequency.balanced" },
  { m: 30, labelKey: null, subKey: "frequency.rare" },
  { m: 0, labelKey: "frequency.off", subKey: "frequency.custom" },
];

function Freq() {
  const { activeChild } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [sel, setSel] = useState(10);
  const [aiEval, setAiEval] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeChild) return;
    childrenApi.getFrequency(activeChild.id).then((f) => {
      setSel(f.intervalMinutes);
      setAiEval(f.aiEvaluationEnabled);
    }).catch(() => undefined);
  }, [activeChild]);

  async function handleSave() {
    if (!activeChild) return;
    setIsSaving(true);
    try {
      await childrenApi.setFrequency(activeChild.id, sel, aiEval);
      navigate({ to: "/settings" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <MobileFrame>
      <div className="md:max-w-2xl md:mx-auto">
        <ScreenHeader title={t("frequency.title")} back="/settings" />
        <p className="text-xs md:text-sm text-muted-foreground mb-4 text-center">{t("frequency.subtitle")}</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {opts.map((o) => <Tile key={o.m} o={o} sel={sel} setSel={setSel} t={t} />)}
        </div>
        <div className="mt-6 rounded-2xl p-4 bg-card border border-border/60 flex gap-3 items-start">
          <span className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">✦</span>
          <p className="text-xs text-muted-foreground leading-snug">{t("frequency.tip")}</p>
        </div>

        <h2 className="text-sm font-bold mt-8 mb-1">{t("frequency.aiEvalTitle")}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t("frequency.aiEvalSubtitle")}</p>
        <div className="grid grid-cols-2 gap-3 md:max-w-sm">
          <AiEvalTile active={aiEval} onClick={() => setAiEval(true)} icon={<Sparkles className="w-6 h-6 mx-auto text-primary-glow" />} labelKey="frequency.aiOn" subKey="frequency.aiOnSub" t={t} />
          <AiEvalTile active={!aiEval} onClick={() => setAiEval(false)} icon={<Power className="w-6 h-6 mx-auto text-primary-glow" />} labelKey="frequency.aiOff" subKey="frequency.aiOffSub" t={t} />
        </div>

        <button onClick={handleSave} disabled={isSaving || !activeChild} className="mt-6 w-full md:w-auto md:px-10 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-60">
          {isSaving ? t("frequency.saving") : t("frequency.save")}
        </button>
      </div>
    </MobileFrame>
  );
}

function AiEvalTile({ active, onClick, icon, labelKey, subKey, t }: { active: boolean; onClick: () => void; icon: React.ReactNode; labelKey: TranslationKey; subKey: TranslationKey; t: ReturnType<typeof useT> }) {
  return (
    <button onClick={onClick} className={`relative rounded-2xl p-3 border transition ${active ? "border-primary shadow-glow bg-card" : "border-border/60 bg-card"}`}>
      {active && <Check className="absolute top-2 right-2 w-4 h-4 text-primary-glow" />}
      {icon}
      <div className="text-sm font-bold mt-2">{t(labelKey)}</div>
      <div className="text-[10px] text-muted-foreground">{t(subKey)}</div>
    </button>
  );
}
function Tile({ o, sel, setSel, t }: any) {
  const active = sel === o.m;
  return (
    <button onClick={() => setSel(o.m)} className={`relative rounded-2xl p-3 border transition ${active ? "border-primary shadow-glow bg-card" : "border-border/60 bg-card"}`}>
      {active && <Check className="absolute top-2 right-2 w-4 h-4 text-primary-glow" />}
      <Clock className="w-6 h-6 mx-auto text-primary-glow" />
      <div className="text-sm font-bold mt-2">{o.labelKey ? t(o.labelKey) : t("frequency.minutesFmt", { n: o.m })}</div>
      <div className="text-[10px] text-muted-foreground">{t(o.subKey)}</div>
      {o.rec && <div className="text-[9px] mt-1 text-success">{t("frequency.recommended")}</div>}
    </button>
  );
}
