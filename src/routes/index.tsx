import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/echoryx/Logo";
import { Stars } from "@/components/echoryx/Stars";
import tiger from "@/assets/tiger-mascot.png";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

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
  const { isAuthenticated } = useAuth();
  const t = useT();
  useEffect(() => {
    // This used to always land on /login, no matter what — so opening a fresh tab looked
    // exactly like being signed out even though the saved session (and every other open tab)
    // was completely untouched. isAuthenticated is known synchronously from the stored token,
    // so there's no race to worry about here.
    const timer = setTimeout(() => navigate({ to: isAuthenticated ? "/home" : "/login" }), 2200);
    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <Stars />
      <div className="relative flex flex-col items-center gap-8 animate-slide-up px-4">
        <Logo className="w-56 md:w-72 desktop:w-80" />
        <div className="relative">
          <div className="absolute inset-0 rounded-full gradient-primary blur-3xl opacity-40" />
          <img src={tiger} alt="Tiger mascot" className="relative w-40 md:w-48 desktop:w-56 animate-float" />
        </div>
        <p className="text-muted-foreground text-sm md:text-base tracking-wider uppercase">{t("splash.tagline")}</p>
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
  );
}
