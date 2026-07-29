import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, X } from "lucide-react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { Stars } from "@/components/echoryx/Stars";
import tiger from "@/assets/tiger-mascot.png";

export const Route = createFileRoute("/overlay")({
  head: () => ({
    meta: [
      { title: "Overlay interaction · EchoRyx" },
      { name: "description", content: "In-the-moment questions that spark curiosity while watching." },
      { property: "og:title", content: "Overlay interaction · EchoRyx" },
      { property: "og:description", content: "Real-time learning prompts." },
    ],
  }),
  component: Overlay,
});

function Overlay() {
  return (
    <MobileFrame>
      <div className="relative">
        <Stars />
        <div className="relative flex items-center justify-between pt-2">
          <span className="text-xs px-3 py-1 rounded-full bg-card border border-border flex items-center gap-1"><Clock className="w-3 h-3" /> 04:53 left</span>
          <Link to="/home" className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center"><X className="w-4 h-4" /></Link>
        </div>

        <div className="relative mt-6 rounded-3xl p-5 bg-card border border-border/60 shadow-card animate-slide-up">
          <div className="flex items-start gap-3">
            <img src={tiger} className="w-16 -mt-8 drop-shadow-2xl" alt="Ti Ni" />
            <div>
              <div className="text-sm font-bold">Hi Bé An!</div>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">You're watching so carefully! Do you know why Peppa loves splashing in muddy puddles?</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button className="py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-glow">Fun!</button>
            <button className="py-3.5 rounded-2xl bg-secondary border border-border font-semibold">Because…</button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">Tip: overlays appear during natural pauses so they don't interrupt the story.</p>
      </div>
    </MobileFrame>
  );
}