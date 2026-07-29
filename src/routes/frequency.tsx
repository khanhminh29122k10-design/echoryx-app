import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth, useAuth } from "@/lib/auth";
import { childrenApi } from "@/lib/api";

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

const opts = [
  { m: 5, label: "5 min", sub: "Very frequent" },
  { m: 10, label: "10 min", sub: "Frequent", rec: true },
  { m: 20, label: "20 min", sub: "Balanced" },
  { m: 30, label: "30 min", sub: "Rare" },
  { m: 0, label: "Off", sub: "Custom" },
];

function Freq() {
  const { activeChild } = useAuth();
  const navigate = useNavigate();
  const [sel, setSel] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeChild) return;
    childrenApi.getFrequency(activeChild.id).then((f) => setSel(f.intervalMinutes)).catch(() => undefined);
  }, [activeChild]);

  async function handleSave() {
    if (!activeChild) return;
    setIsSaving(true);
    try {
      await childrenApi.setFrequency(activeChild.id, sel);
      navigate({ to: "/settings" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <MobileFrame>
      <ScreenHeader title="Interaction frequency" back="/settings" />
      <p className="text-xs text-muted-foreground mb-4 text-center">Choose how often Niso will appear to chat with your child.</p>
      <div className="grid grid-cols-3 gap-3">
        {opts.slice(0,3).map((o) => <Tile key={o.m} o={o} sel={sel} setSel={setSel} />)}
        {opts.slice(3).map((o) => <Tile key={o.m} o={o} sel={sel} setSel={setSel} />)}
      </div>
      <div className="mt-6 rounded-2xl p-4 bg-card border border-border/60 flex gap-3 items-start">
        <span className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">✦</span>
        <p className="text-xs text-muted-foreground leading-snug">A balanced rhythm helps your child stay curious without breaking their focus too often.</p>
      </div>
      <button onClick={handleSave} disabled={isSaving || !activeChild} className="mt-6 w-full py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-60">
        {isSaving ? "Saving…" : "Save settings"}
      </button>
    </MobileFrame>
  );
}
function Tile({ o, sel, setSel }: any) {
  const active = sel === o.m;
  return (
    <button onClick={() => setSel(o.m)} className={`relative rounded-2xl p-3 border transition ${active ? "border-primary shadow-glow bg-card" : "border-border/60 bg-card"}`}>
      {active && <Check className="absolute top-2 right-2 w-4 h-4 text-primary-glow" />}
      <Clock className="w-6 h-6 mx-auto text-primary-glow" />
      <div className="text-sm font-bold mt-2">{o.label}</div>
      <div className="text-[10px] text-muted-foreground">{o.sub}</div>
      {o.rec && <div className="text-[9px] mt-1 text-success">Recommended</div>}
    </button>
  );
}
