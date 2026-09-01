import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";

// Despite the name (kept so every route's `<MobileFrame>` usage didn't need
// touching), this is the app's responsive shell, not a phone mockup anymore:
// mobile renders full-bleed with a bottom nav, tablet/desktop get a
// persistent left Sidebar + a centered, width-capped content column so pages
// don't just stretch edge-to-edge on large monitors.
export function MobileFrame({
  children,
  className,
  noPadding,
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className="min-h-screen w-full flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full desktop:max-w-6xl">
          <div
            className={cn(
              "min-h-screen md:min-h-0",
              !noPadding && "px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8 desktop:px-12",
              className,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
