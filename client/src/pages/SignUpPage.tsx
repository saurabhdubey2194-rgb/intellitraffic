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
  User,
  Mail,
  Lock,
  Zap,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function validate(form: FormState): { field?: keyof FormState; message: string } | null {
  if (form.name.trim().length < 2) return { field: "name", message: "Identity name must be at least 2 characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return { field: "email", message: "Provide a valid communication index." };
  if (form.password.length < 8) return { field: "password", message: "Signature must be at least 8 characters." };
  if (form.password !== form.confirmPassword)
    return { field: "confirmPassword", message: "Signatures do not match." };
  return null;
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

  const sendVerification = trpc.auth.sendVerification.useMutation({
    onSuccess: (data) => {
      toast.success("Verification sequence initiated.", {
        description: "Check your communication index for the verification link."
      });
      // In demo mode, we'll show the link for easy testing
      console.log(`[Demo] Verification link: ${data.link}`);
    }
  });

  const { refresh } = useAuth();

  const signUp = trpc.auth.signUp.useMutation({
    onSuccess: async () => {
      toast.success("Identity initialized. Welcome to the Matrix.");
      sendVerification.mutate();
      // Force refresh auth state before navigating
      await refresh();
      navigate("/dashboard", { replace: true });
    },
    onError: (err: any) => {
      setError(err.message);
      toast.error("Initialization failed.");
    },
  });

  useEffect(() => {
    if (!loading && user) {
      // Check if there's a redirect parameter
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      navigate(redirect || "/dashboard", { replace: true });
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
      setError("This index is already registered in the Matrix.");
      setFieldErrors(prev => ({ ...prev, email: "Index already registered" }));
      return;
    }
    signUp.mutate({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
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
          onClick={() => navigate("/signin")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Portal
        </Button>

        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-bold font-rajdhani uppercase tracking-tight">Initialize <span className="text-primary">Identity</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Create a new neural signature to begin authenticity scans.
          </p>
        </div>

        <Card className="rounded-3xl border-white/5 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-3">
              <Label htmlFor="signup-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Identity Name <span className="text-primary">*</span>
              </Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  id="signup-name" 
                  className={`pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all ${fieldErrors.name ? "border-red-500/50" : ""}`} 
                  placeholder="e.g. Neo Anderson" 
                  value={form.name} 
                  onChange={set("name")} 
                  aria-invalid={Boolean(fieldErrors.name)} 
                />
              </div>
              {fieldErrors.name && <p className="text-[8px] font-black text-red-400 uppercase tracking-widest ml-1">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="signup-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Communication Index <span className="text-primary">*</span>
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  className={`pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all ${fieldErrors.email ? "border-red-500/50" : ""}`}
                  placeholder="you@matrix.com"
                  value={form.email}
                  onChange={set("email")}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </div>
              {fieldErrors.email && <p className="text-[8px] font-black text-red-400 uppercase tracking-widest ml-1">{fieldErrors.email}</p>}
              {availability.data?.emailAvailable === false && (
                <Badge variant="outline" className="border-red-500/20 text-red-400 bg-red-500/5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                  Index already registered
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="signup-password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Neural Signature <span className="text-primary">*</span>
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all ${fieldErrors.password ? "border-red-500/50" : ""}`}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  onClick={() => setShowPassword(s => !s)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[8px] font-black text-red-400 uppercase tracking-widest ml-1">{fieldErrors.password}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="signup-confirm" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Confirm Signature <span className="text-primary">*</span>
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="signup-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all ${fieldErrors.confirmPassword ? "border-red-500/50" : ""}`}
                  placeholder="Re-enter signature"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
              </div>
              {fieldErrors.confirmPassword && <p className="text-[8px] font-black text-red-400 uppercase tracking-widest ml-1">{fieldErrors.confirmPassword}</p>}
            </div>

            {error && !fieldErrors.password && !fieldErrors.name && !fieldErrors.email && !fieldErrors.confirmPassword && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400" role="alert">
                <AlertTriangle className="h-3 w-3 inline mr-2" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={signUp.isPending}>
              {signUp.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              {signUp.isPending ? "Initializing…" : "Initialize Identity"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Already verified?{" "}
              <button type="button" className="text-primary hover:underline underline-offset-4" onClick={() => navigate("/signin")}>
                Return to Portal
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


