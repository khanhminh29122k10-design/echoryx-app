import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BarChart3, Sparkles, Settings, User } from "lucide-react";
import { Logo } from "./Logo";
import { useT, type TranslationKey } from "@/lib/i18n";

const items = [
  { to: "/home", labelKey: "nav.home", icon: Home },
  { to: "/parent", labelKey: "nav.dashboard", icon: BarChart3 },
  { to: "/characters", labelKey: "nav.characters", icon: Sparkles },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
  { to: "/profile", labelKey: "nav.profile", icon: User },
] as const satisfies { to: string; labelKey: TranslationKey; icon: unknown }[];

// The same set of routes that render <BottomNav/> on mobile — this is the
// tablet/desktop equivalent (persistent left rail instead of a bottom bar).
// Screens outside this set (auth, conversation, frequency, ...) render
// neither nav, matching current mobile behavior.
const NAV_ROUTES = new Set(
  items.map((i) => i.to as string).concat(["/child", "/rewards", "/progress", "/devices", "/analytics"]),
);

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();
  if (!NAV_ROUTES.has(path)) return null;

  return (
    <aside className="hidden md:flex md:sticky md:top-0 md:h-screen md:w-20 desktop:w-64 md:shrink-0 md:flex-col md:gap-1 border-r border-border/50 bg-card/40 backdrop-blur-xl px-2 desktop:px-4 py-6 desktop:py-8">
      <Link to="/home" className="mb-6 desktop:mb-10 flex items-center justify-center desktop:justify-start px-1 desktop:px-3">
        <Logo className="w-9 desktop:w-28" />
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 justify-center desktop:justify-start px-2 desktop:px-3 py-3 rounded-2xl transition-all ${
                active ? "gradient-primary shadow-glow text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden desktop:inline text-sm font-semibold">{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
