import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Edit2, ChevronRight, Star, Trophy, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { BottomNav } from "@/components/echoryx/BottomNav";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import tiger from "@/assets/tiger-mascot.png";
import { RequireAuth, useAuth } from "@/lib/auth";
import { progressApi, rewardsApi, type ProgressReport, type RewardsSummary } from "@/lib/api";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · EchoRyx" },
      { name: "description", content: "Your EchoRyx family profile." },
      { property: "og:title", content: "Profile · EchoRyx" },
      { property: "og:description", content: "Manage your account and kids." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  ),
});

const AGE_GROUP_KEY: Record<string, TranslationKey> = {
  toddler: "profile.ageToddler",
  preschool: "profile.agePreschool",
  early_elementary: "profile.ageEarlyElementary",
  elementary: "profile.ageElementary",
};

function Profile() {
  const { parent, children: kids, activeChild, setActiveChildId } = useAuth();
  const t = useT();
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);
  const [progress, setProgress] = useState<ProgressReport | null>(null);

  useEffect(() => {
    if (!activeChild) return;
    rewardsApi.summary(activeChild.id).then(setRewards).catch(() => undefined);
    progressApi.report(activeChild.id).then(setProgress).catch(() => undefined);
  }, [activeChild]);

  const accountLinks: [string, TranslationKey][] = [
    ["/personal-info", "profile.personalInfo"],
    ["/subscription", "profile.subscription"],
    ["/help-support", "profile.helpSupport"],
  ];

  return (
    <MobileFrame>
      <ScreenHeader title={t("profile.title")} right={<Link to="/personal-info" className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center"><Edit2 className="w-4 h-4" /></Link>} />

      <div className="desktop:grid desktop:grid-cols-3 desktop:gap-8 desktop:items-start">
        <div className="desktop:col-span-1">
          <div className="flex flex-col items-center mt-2">
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full gradient-primary flex items-center justify-center shadow-glow overflow-hidden">
                <img src={tiger} className="w-20 md:w-24 -mb-2" alt="Avatar" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border-2 border-background flex items-center justify-center"><Camera className="w-4 h-4" /></button>
            </div>
            <div className="mt-3 font-bold text-lg">{parent?.name ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{parent?.email}</div>
          </div>

          <div className="grid grid-cols-3 desktop:grid-cols-1 gap-2 mt-5">
            <Kpi icon={<Trophy className="w-4 h-4" />} n={progress ? String(progress.kpis.badges) : "—"} l={t("profile.badges")} />
            <Kpi icon={<Star className="w-4 h-4" />} n={rewards ? String(rewards.starBalance) : "—"} l={t("profile.stars")} />
            <Kpi icon={<Clock className="w-4 h-4" />} n={progress ? `${progress.kpis.learningHours}h` : "—"} l={t("profile.learning")} />
          </div>
        </div>

        <div className="desktop:col-span-2">
          <h2 className="font-bold mt-6 desktop:mt-0 mb-3">{t("profile.kids")}</h2>
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
            {kids.map((kid) => (
              <button
                key={kid.id}
                onClick={() => setActiveChildId(kid.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-card border transition ${kid.id === activeChild?.id ? "border-primary shadow-glow" : "border-border/60"}`}
              >
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {kid.avatarInitial ?? kid.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold truncate">{kid.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t(AGE_GROUP_KEY[kid.ageGroup] ?? "profile.agePreschool")}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
            <Link to="/characters" className="block w-full text-center py-3 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary-glow transition">
              {t("profile.addChild")}
            </Link>
          </div>

          <h2 className="font-bold mt-6 mb-3">{t("profile.account")}</h2>
          <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
            {accountLinks.map(([to, labelKey], i) => (
              <Link key={labelKey} to={to} className={`flex items-center p-4 ${i > 0 && "border-t border-border/50"}`}>
                <span className="flex-1 text-sm">{t(labelKey)}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </MobileFrame>
  );
}
function Kpi({ icon, n, l }: any) {
  return (
    <div className="rounded-2xl p-3 bg-card border border-border/60 text-center">
      <div className="w-8 h-8 rounded-full gradient-primary mx-auto flex items-center justify-center text-primary-foreground">{icon}</div>
      <div className="text-lg font-bold mt-1">{n}</div>
      <div className="text-[10px] text-muted-foreground">{l}</div>
    </div>
  );
}
