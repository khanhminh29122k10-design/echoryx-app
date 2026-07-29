import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen w-full flex items-center justify-center py-4 md:py-8 px-2">
      <div className="relative w-full max-w-[420px] min-h-[calc(100vh-2rem)] md:h-[880px] md:min-h-0 rounded-[2.5rem] border border-border/50 shadow-card overflow-hidden gradient-card">
        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-1 text-[11px] font-semibold text-foreground/80">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span>●●●●</span>
            <span>100%</span>
          </div>
        </div>
        <div className={cn("overflow-y-auto h-[calc(100%-1.5rem)]", !noPadding && "px-5 pb-24 pt-2", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}