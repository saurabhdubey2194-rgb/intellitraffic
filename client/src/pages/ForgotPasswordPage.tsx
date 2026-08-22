import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, Mail, Loader2, Zap } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotPassword = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Reset protocol initiated. Check your index.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate reset protocol");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your communication email");
    forgotPassword.mutate({ email });
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
            <CardTitle className="text-3xl font-bold font-rajdhani uppercase tracking-tight text-white">Reset <span className="text-primary">Protocol</span></CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {submitted 
                ? "Neural link dispatched to your communication index."
                : "Enter your registered email to receive a secure reset link."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {submitted ? (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4 group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white">Link Dispatched</p>
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">{email}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full h-12 text-[10px] font-bold uppercase tracking-widest border-white/10 hover:bg-white/5 rounded-xl text-white" 
                onClick={() => setSubmitted(false)}
              >
                Try Different Index
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Communication Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@matrix.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={forgotPassword.isPending}
              >
                {forgotPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                Initiate Reset
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/signin" className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portal
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
