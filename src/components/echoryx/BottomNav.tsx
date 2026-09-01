import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BarChart3, Sparkles, Settings, User } from "lucide-react";
import { useT, type TranslationKey } from "@/lib/i18n";

const items = [
  { to: "/home", labelKey: "nav.home", icon: Home },
  { to: "/parent", labelKey: "nav.dashboard", icon: BarChart3 },
  { to: "/characters", labelKey: "nav.characters", icon: Sparkles },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
  { to: "/profile", labelKey: "nav.profile", icon: User },
] as const satisfies { to: string; labelKey: TranslationKey; icon: unknown }[];

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 pt-2 bg-background/80 backdrop-blur-xl border-t border-border/50 md:hidden">
      <ul className="flex justify-between items-center">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const active = path === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    active ? "gradient-primary shadow-glow" : ""
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-primary-foreground" : ""}`} />
                </div>
                <span className="text-[10px] font-medium">{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
