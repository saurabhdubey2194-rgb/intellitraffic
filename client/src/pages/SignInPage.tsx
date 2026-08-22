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
  Lock,
  Mail,
  Zap,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
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

  const { refresh } = useAuth();

  const signIn = trpc.auth.signInWithPassword.useMutation({
    onSuccess: async () => {
      toast.success("Neural signature verified. Access granted.");
      await refresh();
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) {
        navigate(redirect, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    },
    onError: err => {
      setError(err.message);
      toast.error("Authentication failed. Invalid signature.");
    },
  });

  // Correctly handle redirection in useEffect to avoid render-phase navigation
  useEffect(() => {
    if (!loading && user) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) {
        navigate(redirect, { replace: true });
      } else {
        if (user.role === "admin") navigate("/admin", { replace: true });
        else if (user.role === "investigator") navigate("/investigator", { replace: true });
        else navigate("/dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#07111F] flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please provide both email and neural signature.");
      return;
    }
    signIn.mutate(form);
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-white flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/30 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-600/30 blur-[120px] rounded-full" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="container flex items-center justify-center gap-4 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Shield className="h-7 w-7 text-black" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black tracking-tighter font-rajdhani uppercase">
              FakeShield <span className="text-primary">AI</span>
            </p>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Digital Authenticity Matrix
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-md py-16 px-4 relative z-10">
        <Button
          variant="ghost"
          size="sm"
          className="mb-8 -ml-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Matrix
        </Button>

        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-bold font-rajdhani uppercase tracking-tight">Access <span className="text-primary">Portal</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Verify your neural signature to access the workspace.
          </p>
        </div>

        <Card className="rounded-3xl border-white/5 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-3">
              <Label htmlFor="signin-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Communication Index
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@matrix.com"
                  className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all"
                  value={form.email}
                  onChange={e => {
                    setForm(f => ({ ...f, email: e.target.value }));
                    setError(null);
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="signin-password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Neural Signature
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all"
                  value={form.password}
                  onChange={e => {
                    setForm(f => ({ ...f, password: e.target.value }));
                    setError(null);
                  }}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  onClick={() => setShowPassword(s => !s)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400" role="alert">
                <AlertTriangle className="h-3 w-3 inline mr-2" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={signIn.isPending}>
              {signIn.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              {signIn.isPending ? "Authenticating…" : "Verify Access"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button" 
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Neural Signature?
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              New to the Matrix?{" "}
              <button type="button" className="text-primary hover:underline underline-offset-4" onClick={() => navigate("/signup")}>
                Initialize Account
              </button>
            </p>
          </div>
        </Card>
      </main>

      <footer className="relative z-10 py-8 text-center text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-50">
        <p>FakeShield AI — Neural Authenticity Node</p>
      </footer>
    </div>
  );
}


