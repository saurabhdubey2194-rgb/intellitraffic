import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User, Mail, Lock, CheckCircle2, AlertTriangle, Save, Loader2, Zap, Fingerprint, Key, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ProfilePage() {
  const utils = trpc.useUtils();
  const { logout } = useAuth();
  const { data: user, isLoading } = trpc.auth.profile.useQuery();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Sync state when data loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setIsEditing(false);
      utils.auth.profile.invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    }
  });

  const handleSave = () => {
    updateMutation.mutate({ name, email });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Fingerprint className="h-3 w-3" />
            Neural Identity
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase">Account <span className="text-primary">Profile</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Manage your digital signature and forensic security credentials.</p>
        </div>
        
        <Button 
          variant="outline" 
          className="h-12 px-6 border-red-500/20 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Terminate Session
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-2 space-y-8">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight">Profile Configuration</CardTitle>
              <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Update your personal forensic details and communication index.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Identity Name</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="name" 
                      value={isEditing ? name : (user?.name || "")} 
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing}
                      className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Communication Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="email" 
                      type="email"
                      value={isEditing ? email : (user?.email || "")} 
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isEditing}
                      className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={updateMutation.isPending} className="h-14 px-8 bg-primary hover:bg-primary/90 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                      {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Commit Changes
                    </Button>
                    <Button variant="ghost" className="h-14 px-8 rounded-2xl text-[10px] font-bold uppercase tracking-widest" onClick={() => setIsEditing(false)}>Abort</Button>
                  </>
                ) : (
                  <Button variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest" onClick={() => {
                    setName(user?.name || "");
                    setEmail(user?.email || "");
                    setIsEditing(true);
                  }}>
                    Modify Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-rajdhani uppercase tracking-tight">Neural Verification Level</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Your account is currently operating at Tier 1 forensic capacity.</p>
              </div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[65%] bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Standard Access</span>
              <span className="text-primary">Upgrade to Enterprise for Full Spectrum</span>
            </div>
          </div>
        </div>

        {/* Status & Security */}
        <div className="space-y-8">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-6 border-b border-white/5">
              <CardTitle className="font-rajdhani text-lg uppercase tracking-tight">Security Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verification</span>
                <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${user?.verificationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {user?.verificationStatus}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Access Role</span>
                <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest">
                  {user?.role}
                </div>
              </div>
              
              <div className="h-px w-full bg-white/5" />
              
              {user?.verificationStatus === 'verified' ? (
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p className="text-[9px] font-bold leading-relaxed text-emerald-500/80 uppercase tracking-widest">
                    Neural signature verified. Full forensic reporting enabled.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-[9px] font-bold leading-relaxed text-amber-500/80 uppercase tracking-widest">
                    Identity pending verification. Limited scan capacity.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-6 border-b border-white/5">
              <CardTitle className="font-rajdhani text-lg uppercase tracking-tight">Forensic Access</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-12 justify-start border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                onClick={() => toast.info("Security key integration coming soon")}
              >
                <Key className="mr-3 h-4 w-4 text-primary" />
                Manage Keys
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 justify-start border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                onClick={() => toast.info("Two-factor authentication coming soon")}
              >
                <Lock className="mr-3 h-4 w-4 text-primary" />
                2FA Console
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 justify-start border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400"
                onClick={() => toast.info("Data export feature coming soon")}
              >
                <Shield className="mr-3 h-4 w-4" />
                Neural Wipe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
