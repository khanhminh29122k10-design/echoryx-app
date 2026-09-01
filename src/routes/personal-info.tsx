import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth, useAuth } from "@/lib/auth";
import { authApi, ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/personal-info")({
  head: () => ({
    meta: [
      { title: "Personal info · EchoRyx" },
      { name: "description", content: "Update your name and contact details." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <PersonalInfo />
    </RequireAuth>
  ),
});

function PersonalInfo() {
  const { parent, setParent } = useAuth();
  const t = useT();
  const [name, setName] = useState(parent?.name ?? "");
  const [phone, setPhone] = useState(parent?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const updated = await authApi.updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setParent(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("personalInfo.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileFrame>
      <div className="md:max-w-lg md:mx-auto">
        <ScreenHeader title={t("personalInfo.title")} back="/profile" />

        <div className="rounded-2xl p-4 bg-card border border-border/60 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground ml-1">{t("personalInfo.name")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full px-4 py-3 rounded-2xl bg-input/60 border border-border focus:border-primary outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground ml-1">{t("personalInfo.phone")}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("personalInfo.phonePlaceholder")}
              className="mt-1.5 w-full px-4 py-3 rounded-2xl bg-input/60 border border-border focus:border-primary outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground ml-1">{t("personalInfo.email")}</label>
            <div className="mt-1.5 w-full px-4 py-3 rounded-2xl bg-input/30 border border-border/60 text-sm text-muted-foreground">
              {parent?.email}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 ml-1">{t("personalInfo.emailNote")}</p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {saved && !error && <p className="text-xs text-success">{t("personalInfo.saved")}</p>}

          <button
            onClick={handleSave}
            disabled={busy || !name.trim()}
            className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold disabled:opacity-60"
          >
            {busy ? t("personalInfo.saving") : t("personalInfo.save")}
          </button>
        </div>
      </div>
    </MobileFrame>
  );
}
