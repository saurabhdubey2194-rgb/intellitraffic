import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, Mail, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotPassword = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Reset link sent to your email");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    forgotPassword.mutate({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07111F] p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/30 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-600/30 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md border-border/40 bg-black/40 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            {submitted 
              ? "Check your email for instructions to reset your password."
              : "Enter your email address and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-blue-200">Reset link sent to {email}</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setSubmitted(false)}
              >
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-border/40"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                disabled={forgotPassword.isPending}
              >
                {forgotPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/signin" className="inline-flex items-center text-sm text-muted-foreground hover:text-blue-500 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
