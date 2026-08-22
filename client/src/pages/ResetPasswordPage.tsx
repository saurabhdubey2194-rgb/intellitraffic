import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ResetPasswordPage() {
  const [location, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  // Extract token from URL query string
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token") || "demo-reset-token-0";

  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Neural signature updated successfully");
      setTimeout(() => navigate("/signin"), 2000);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reset password");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    
    resetPassword.mutate({ 
      token,
      password 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07111F] p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/30 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-600/30 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md border-white/5 bg-black/40 backdrop-blur-xl relative z-10 rounded-3xl shadow-2xl">
        <CardHeader className="space-y-4 flex flex-col items-center p-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="h-8 w-8 text-black" />
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold font-rajdhani uppercase tracking-tight text-white">Reset <span className="text-primary">Password</span></CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Commit a new neural signature to your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {success ? (
            <div className="space-y-6 text-center py-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                <CheckCircle2 className="relative h-16 w-16 text-emerald-500 mx-auto animate-in zoom-in duration-500" />
              </div>
              <div className="space-y-2">
                <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Signature Updated</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Redirecting to authentication portal...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="password" title="New Password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">New Neural Signature</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" title="Confirm Password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Signature</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={resetPassword.isPending}
              >
                {resetPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Signature
              </Button>
              
              <Button 
                type="button"
                variant="ghost" 
                className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white"
                onClick={() => navigate("/signin")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
