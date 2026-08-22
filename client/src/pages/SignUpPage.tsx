/**
 * Public sign-up page — FakeShield AI account creation.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

/** Friendly per-field validation, returns the first failing field or null. */
function validate(form: FormState): { field?: keyof FormState; message: string } | null {
  if (form.name.trim().length < 2) return { field: "name", message: "Full name must be at least 2 characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return { field: "email", message: "Enter a valid email address." };
  if (form.password.length < 8) return { field: "password", message: "Password must be at least 8 characters." };
  if (form.password !== form.confirmPassword)
    return { field: "confirmPassword", message: "Passwords do not match." };
  return null;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const availability = trpc.auth.checkAvailability.useQuery(
    { email: form.email.trim().toLowerCase() || undefined },
    { enabled: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) },
  );

  const signUp = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully!");
      navigate("/dashboard", { replace: true });
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  if (!loading && user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setFieldErrors(f => ({ ...f, [k]: undefined }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issue = validate(form);
    if (issue) {
      setFieldErrors(prev => ({ ...prev, [issue.field!]: issue.message }));
      setError(issue.message);
      return;
    }
    if (availability.data?.emailAvailable === false) {
      setError("This email is already registered.");
      setFieldErrors(prev => ({ ...prev, email: "Email already registered" }));
      return;
    }
    signUp.mutate({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
  };

  const inputCls = (k: keyof FormState) =>
    `w-full ${fieldErrors[k] ? "border-red-400/70 focus-visible:ring-red-400/50" : ""}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/60 bg-[#0b1526]">
        <div className="container flex items-center justify-center gap-3 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-400/25">
            <Shield className="h-6 w-6 text-blue-400" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold tracking-tight">
              FakeShield <span className="text-blue-400">AI</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Digital Authenticity. Powered by AI.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-md py-10 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/signin")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Sign up to start analyzing media for digital manipulation.
          </p>
        </div>

        <Card className="rounded-2xl border p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="signup-name" className="text-sm font-semibold">
                Full Name <span className="text-red-400">*</span>
              </Label>
              <Input id="signup-name" className={inputCls("name")} placeholder="e.g. John Doe" value={form.name} onChange={set("name")} aria-invalid={Boolean(fieldErrors.name)} />
              {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-sm font-semibold">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                className={inputCls("email")}
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}
              {availability.data?.emailAvailable === false && (
                <Badge variant="outline" className="border-red-400/50 text-red-400 text-[10px]">
                  Email already registered
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-password" className="text-sm font-semibold">
                Password <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={inputCls("password")}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-400">{fieldErrors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-confirm" className="text-sm font-semibold">
                Confirm Password <span className="text-red-400">*</span>
              </Label>
              <Input
                id="signup-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className={inputCls("confirmPassword")}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
              />
              {fieldErrors.confirmPassword && <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>}
            </div>

            {error && !fieldErrors.password && !fieldErrors.name && !fieldErrors.email && !fieldErrors.confirmPassword && (
              <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={signUp.isPending}>
              {signUp.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              {signUp.isPending ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/60 pt-4 space-y-2 text-[11px] text-muted-foreground leading-relaxed">
            <p>
              Already have an account?{" "}
              <button type="button" className="text-blue-400 underline-offset-2 hover:underline" onClick={() => navigate("/signin")}>
                Sign in
              </button>
            </p>
          </div>
        </Card>
      </main>

      <footer className="border-t border-border/60 py-5 text-center text-[11px] text-muted-foreground">
        <p>FakeShield AI — Digital Authenticity Platform</p>
      </footer>
    </div>
  );
}
