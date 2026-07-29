import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, User } from "lucide-react";
import { useState } from "react";
import { MobileFrame } from "@/components/echoryx/MobileFrame";
import { Logo } from "@/components/echoryx/Logo";
import { Stars } from "@/components/echoryx/Stars";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account · EchoRyx" },
      { name: "description", content: "Create your EchoRyx family account to get started in minutes." },
      { property: "og:title", content: "Create account · EchoRyx" },
      { property: "og:description", content: "Join thousands of families using EchoRyx." },
    ],
  }),
  component: Register,
});

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, password, name });
      navigate({ to: "/characters" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobileFrame>
      <div className="relative">
        <Stars />
        <div className="relative">
          <div className="flex justify-center pt-4"><Logo className="w-36" /></div>
          <h2 className="text-center text-2xl font-bold mt-6">Create your account</h2>
          <p className="text-center text-sm text-muted-foreground mt-1">Start your family's learning journey</p>

          <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
            <Field icon={<User className="w-4 h-4" />} label="Parent name" placeholder="Your full name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
            <Field icon={<Mail className="w-4 h-4" />} label="Email" placeholder="you@family.com" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
            <Field icon={<Lock className="w-4 h-4" />} label="Password" placeholder="8+ characters" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required minLength={8} />
            <Field icon={<Lock className="w-4 h-4" />} label="Confirm password" placeholder="Repeat password" type="password" value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} required />

            <label className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
              <input type="checkbox" className="mt-0.5 accent-primary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>I agree to the <a className="text-primary-glow">Terms</a> and <a className="text-primary-glow">Privacy Policy</a>, and consent to my child using EchoRyx.</span>
            </label>

            {error && <p className="text-xs text-destructive text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full text-center py-3.5 mt-2 rounded-2xl gradient-primary shadow-glow font-semibold text-primary-foreground disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-primary-glow font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </MobileFrame>
  );
}

function Field({ icon, label, ...rest }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground ml-1">{label}</label>
      <div className="mt-1 flex items-center gap-2 px-4 py-3 rounded-2xl bg-input/60 border border-border focus-within:border-primary transition">
        <span className="text-muted-foreground">{icon}</span>
        <input {...rest} className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" />
      </div>
    </div>
  );
}
