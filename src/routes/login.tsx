import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { Logo } from "@/components/echoryx/Logo";
import { Stars } from "@/components/echoryx/Stars";
import tiger from "@/assets/tiger-mascot.png";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · EchoRyx" },
      { name: "description", content: "Log in to EchoRyx to continue your child's learning journey." },
      { property: "og:title", content: "Sign in · EchoRyx" },
      { property: "og:description", content: "Access your EchoRyx parent account." },
    ],
  }),
  component: Login,
});

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: "/home" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("login.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobileFrame>
      <div className="relative md:min-h-[85vh] md:flex md:items-center md:justify-center">
        <Stars />
        <div className="relative pt-2 w-full md:max-w-sm desktop:max-w-md md:mx-auto">
          <div className="flex justify-center"><Logo className="w-40 md:w-48" /></div>
          <div className="relative flex justify-center mt-2">
            <div className="absolute inset-0 rounded-full gradient-primary blur-2xl opacity-30" />
            <img src={tiger} alt="Tiger" className="relative w-28 animate-float" />
          </div>
          <h2 className="text-center text-xl font-bold mt-4">{t("login.welcome")}</h2>
          <p className="text-center text-sm text-muted-foreground">{t("login.subtitle")}</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Field
              icon={<Mail className="w-4 h-4" />}
              label={t("login.email")}
              placeholder={t("login.emailPlaceholder")}
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
            <Field
              icon={<Lock className="w-4 h-4" />}
              label={t("login.password")}
              placeholder={t("login.passwordPlaceholder")}
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              trailing={<Eye className="w-4 h-4 text-muted-foreground" />}
              required
            />
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full text-center py-3.5 rounded-2xl gradient-primary shadow-glow font-semibold text-primary-foreground disabled:opacity-60"
            >
              {isSubmitting ? t("login.submitting") : t("login.submit")}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("login.noAccount")} <Link to="/register" className="text-primary-glow font-semibold">{t("login.signUp")}</Link>
          </p>
        </div>
      </div>
    </MobileFrame>
  );
}

function Field({ icon, label, trailing, ...rest }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground ml-1">{label}</label>
      <div className="mt-1.5 flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-input/60 border border-border focus-within:border-primary focus-within:shadow-glow transition">
        <span className="text-muted-foreground">{icon}</span>
        <input {...rest} className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" />
        {trailing}
      </div>
    </div>
  );
}
