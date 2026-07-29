import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  back = "/home",
  right,
}: {
  title: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5 pt-2">
      <Link
        to={back}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border/60 hover:bg-secondary transition"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="text-lg font-bold">{title}</h1>
      <div className="w-10 h-10 flex items-center justify-center">{right}</div>
    </div>
  );
}