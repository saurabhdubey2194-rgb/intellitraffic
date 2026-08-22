import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const searchParams = new URLSearchParams(useSearch());
  const token = searchParams.get("token");
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      toast.success("Identity node verified successfully.");
    },
    onError: (err) => {
      setStatus("error");
      setErrorMessage(err.message);
      toast.error("Verification failed.");
    }
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
      setErrorMessage("Missing verification token.");
    }
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/5 bg-card/30 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="p-8 pb-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-6">
            {status === "verifying" ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> :
             status === "success" ? <ShieldCheck className="h-8 w-8 text-emerald-500" /> :
             <ShieldAlert className="h-8 w-8 text-red-500" />}
          </div>
          <CardTitle className="text-2xl font-bold font-rajdhani uppercase tracking-tight text-white">
            {status === "verifying" ? "Verifying Node" :
             status === "success" ? "Node Verified" :
             "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">
            {status === "verifying" ? "Synchronizing forensic credentials..." :
             status === "success" ? "Your identity node is now fully operational." :
             "The verification sequence was interrupted."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 text-center">
          {status === "error" && (
            <p className="text-xs text-red-400 font-medium mb-8 bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
              {errorMessage}
            </p>
          )}
          
          {status === "success" ? (
            <Button onClick={() => navigate("/dashboard")} className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-rajdhani font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
              Access Command Center
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : status === "error" ? (
            <Button onClick={() => navigate("/signin")} variant="outline" className="w-full h-12 border-white/10 hover:bg-white/5 text-white font-rajdhani font-bold uppercase tracking-widest rounded-xl">
              Return to Sign In
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
