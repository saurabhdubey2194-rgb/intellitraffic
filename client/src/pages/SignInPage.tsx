/**
 * Sign-in page for FakeShield AI.
 */
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

export default function SignInPage() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = trpc.auth.signInWithPassword.useMutation({
    onSuccess: () => {
      toast.success("Signed in successfully!");
      navigate("/dashboard", { replace: true });
    },
    onError: err => {
      setError(err.message);
    },
  });

  if (!loading && user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }
    signIn.mutate(form);
  };

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
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">
            Access your analysis history and workspace.
          </p>
        </div>

        <Card className="rounded-2xl border p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="signin-email" className="text-sm font-semibold">
                Email
              </Label>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => {
                  setForm(f => ({ ...f, email: e.target.value }));
                  setError(null);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signin-password" className="text-sm font-semibold">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => {
                    setForm(f => ({ ...f, password: e.target.value }));
                    setError(null);
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(s => !s)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={signIn.isPending}>
              {signIn.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              {signIn.isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button 
              type="button" 
              className="text-xs text-muted-foreground hover:text-blue-400 transition-colors"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot your password?
            </button>
          </div>

          <div className="mt-6 border-t border-border/60 pt-4 text-[11px] text-muted-foreground leading-relaxed">
            <p>
              Don't have an account?{" "}
              <button type="button" className="text-blue-400 underline-offset-2 hover:underline" onClick={() => navigate("/signup")}>
                Sign up
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
