import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth } from "@/lib/auth";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/help-support")({
  head: () => ({
    meta: [
      { title: "Help & support · EchoRyx" },
      { name: "description", content: "Answers to common questions, and how to reach us." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <HelpSupport />
    </RequireAuth>
  ),
});

const FAQ: [TranslationKey, TranslationKey][] = [
  ["helpSupport.faq1Q", "helpSupport.faq1A"],
  ["helpSupport.faq2Q", "helpSupport.faq2A"],
  ["helpSupport.faq3Q", "helpSupport.faq3A"],
  ["helpSupport.faq4Q", "helpSupport.faq4A"],
];

function HelpSupport() {
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <MobileFrame>
      <div className="md:max-w-lg md:mx-auto">
        <ScreenHeader title={t("helpSupport.title")} back="/profile" />

        <h2 className="font-bold mb-3 text-sm">{t("helpSupport.faqTitle")}</h2>
        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden mb-5">
          {FAQ.map(([qKey, aKey], i) => {
            const open = openIndex === i;
            return (
              <div key={qKey} className={i > 0 ? "border-t border-border/50" : ""}>
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="text-sm font-semibold">{t(qKey)}</span>
                  <span className="text-muted-foreground text-lg leading-none">{open ? "−" : "+"}</span>
                </button>
                {open && <p className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed">{t(aKey)}</p>}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl p-4 bg-card border border-border/60 flex gap-3 items-center">
          <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary-glow shrink-0">
            <Mail className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{t("helpSupport.contactTitle")}</div>
            <div className="text-xs text-muted-foreground">{t("helpSupport.contactSub")}</div>
          </div>
          <a href={`mailto:${t("helpSupport.contactEmail")}`} className="text-xs font-semibold text-primary-glow shrink-0">
            {t("helpSupport.contactEmail")}
          </a>
        </div>
      </div>
    </MobileFrame>
  );
}
