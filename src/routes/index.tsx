import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/echoryx/Logo";
import { Stars } from "@/components/echoryx/Stars";
import tiger from "@/assets/tiger-mascot.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EchoRyx — Learn, Play, Grow" },
      { name: "description", content: "EchoRyx turns every moment of screen time into an opportunity for kids to learn, connect, and grow with friendly AI companions." },
      { property: "og:title", content: "EchoRyx — Learn, Play, Grow" },
      { property: "og:description", content: "AI companions that help kids learn while they watch." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/login" }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-4 px-2">
      <div className="relative w-full max-w-[420px] min-h-[calc(100vh-2rem)] md:h-[880px] md:min-h-0 rounded-[2.5rem] border border-border/50 shadow-card overflow-hidden gradient-card flex flex-col items-center justify-center">
        <Stars />
        <div className="relative flex flex-col items-center gap-8 animate-slide-up">
          <Logo className="w-56" />
          <div className="relative">
            <div className="absolute inset-0 rounded-full gradient-primary blur-3xl opacity-40" />
            <img src={tiger} alt="Tiger mascot" className="relative w-40 animate-float" />
          </div>
          <p className="text-muted-foreground text-sm tracking-wider uppercase">Learn · Play · Grow</p>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-twinkle"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}