import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BarChart3, Sparkles, Settings, User } from "lucide-react";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/parent", label: "Dashboard", icon: BarChart3 },
  { to: "/characters", label: "Characters", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-2 bg-background/80 backdrop-blur-xl border-t border-border/50">
      <ul className="flex justify-between items-center">
        {items.map(({ to, label, icon: Icon }) => {
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
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}