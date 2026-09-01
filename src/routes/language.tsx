import { createFileRoute } from "@tanstack/react-router";
import { Check, Globe } from "lucide-react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth } from "@/lib/auth";
import { useLocale, useT, type Locale } from "@/lib/i18n";
import { settingsApi } from "@/lib/api";

export const Route = createFileRoute("/language")({
  head: () => ({
    meta: [
      { title: "Language · EchoRyx" },
      { name: "description", content: "Choose English or Vietnamese for the whole app." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Language />
    </RequireAuth>
  ),
});

const OPTIONS: { value: Locale; flag: string }[] = [
  { value: "en", flag: "🇬🇧" },
  { value: "vi", flag: "🇻🇳" },
];

function Language() {
  const { locale, setLocale } = useLocale();
  const t = useT();

  function choose(next: Locale) {
    setLocale(next);
    settingsApi.updateLocale(next).catch(() => undefined); // best-effort — UI already switched via local state
  }

  return (
    <MobileFrame>
      <div className="md:max-w-md md:mx-auto">
        <ScreenHeader title={t("language.title")} back="/settings" />
        <p className="text-xs md:text-sm text-muted-foreground mb-4">{t("language.subtitle")}</p>

        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
          {OPTIONS.map((opt, i) => {
            const active = locale === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => choose(opt.value)}
                className={`w-full flex items-center gap-3 p-4 text-left ${i > 0 ? "border-t border-border/50" : ""} ${active ? "bg-secondary/60" : ""}`}
              >
                <span className="text-xl">{opt.flag}</span>
                <span className="flex-1 text-sm font-semibold">
                  {opt.value === "en" ? t("language.english") : t("language.vietnamese")}
                </span>
                {active && (
                  <span className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl p-4 bg-card border border-border/60 flex gap-3 items-start mt-5">
          <span className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary-glow shrink-0">
            <Globe className="w-4 h-4" />
          </span>
          <p className="text-xs text-muted-foreground leading-snug">
            {t("language.title")} · {locale === "vi" ? t("language.vietnamese") : t("language.english")}
          </p>
        </div>
      </div>
    </MobileFrame>
  );
}
