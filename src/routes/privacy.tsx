import { createFileRoute } from "@tanstack/react-router";
import { Lock, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { ScreenHeader } from "@/components/echoryx/ScreenHeader";
import { RequireAuth } from "@/lib/auth";
import { settingsApi, ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · EchoRyx" },
      { name: "description", content: "Lock Kid mode with a PIN and manage your family's data." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Privacy />
    </RequireAuth>
  ),
});

function Privacy() {
  const t = useT();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    settingsApi.get().then((s) => setHasPin(s.hasPin)).catch(() => setHasPin(false));
  }, []);

  async function handleSetPin() {
    setError(null);
    setSuccess(null);
    if (!/^\d{4}$/.test(pin)) {
      setError(t("privacy.errorLength"));
      return;
    }
    if (pin !== confirmPin) {
      setError(t("privacy.errorMismatch"));
      return;
    }
    setBusy(true);
    try {
      await settingsApi.setPin(pin);
      setHasPin(true);
      setPin("");
      setConfirmPin("");
      setSuccess(hasPin ? t("privacy.successUpdated") : t("privacy.successSet"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("privacy.errorSave"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemovePin() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await settingsApi.removePin();
      setHasPin(false);
      setSuccess(t("privacy.successRemoved"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("privacy.errorRemove"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileFrame>
      <div className="md:max-w-lg md:mx-auto">
        <ScreenHeader title={t("privacy.title")} back="/settings" />

        <div className="rounded-2xl p-4 bg-card border border-border/60 flex gap-3 items-start mb-5">
          <span className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <Lock className="w-4 h-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">{t("privacy.pinCardTitle")}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasPin === null ? "…" : hasPin ? t("privacy.pinCardSetSub") : t("privacy.pinCardUnsetSub")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-card border border-border/60 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground ml-1">{hasPin ? t("privacy.pinLabelNew") : t("privacy.pinLabel")}</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              className="mt-1.5 w-full px-4 py-3 rounded-2xl bg-input/60 border border-border focus:border-primary outline-none text-sm tracking-[0.5em] text-center"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground ml-1">{t("privacy.confirmPin")}</label>
            <input
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              className="mt-1.5 w-full px-4 py-3 rounded-2xl bg-input/60 border border-border focus:border-primary outline-none text-sm tracking-[0.5em] text-center"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-success">{success}</p>}
          <button
            onClick={handleSetPin}
            disabled={busy}
            className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold disabled:opacity-60"
          >
            {busy ? t("privacy.saving") : hasPin ? t("privacy.update") : t("privacy.set")}
          </button>
          {hasPin && (
            <button
              onClick={handleRemovePin}
              disabled={busy}
              className="w-full py-3 rounded-2xl bg-destructive/10 text-destructive font-semibold border border-destructive/30 disabled:opacity-60"
            >
              {t("privacy.remove")}
            </button>
          )}
        </div>

        <div className="rounded-2xl p-4 bg-card border border-border/60 flex gap-3 items-start mt-5">
          <span className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary-glow shrink-0">
            <Shield className="w-4 h-4" />
          </span>
          <p className="text-xs text-muted-foreground leading-snug">{t("privacy.moderationTitle")}</p>
        </div>

        <div className="rounded-2xl p-4 bg-card border border-destructive/30 flex gap-3 items-start mt-3">
          <span className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
            <Trash2 className="w-4 h-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">{t("privacy.deleteTitle")}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{t("privacy.deleteSub")}</p>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}
