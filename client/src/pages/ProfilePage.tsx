import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User, Mail, Lock, CheckCircle2, AlertTriangle, Save, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const utils = trpc.useUtils();
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your identity and security preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and contact email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    value={isEditing ? name : (user?.name || "")} 
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email"
                    value={isEditing ? email : (user?.email || "")} 
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-500">
                      {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => {
                    setName(user?.name || "");
                    setEmail(user?.email || "");
                    setIsEditing(true);
                  }}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status & Security */}
        <div className="space-y-6">
          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Identity Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verification</span>
                <Badge variant={user?.verificationStatus === 'verified' ? 'secondary' : 'outline'} className={user?.verificationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}>
                  {user?.verificationStatus?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant="outline" className="capitalize">{user?.role}</Badge>
              </div>
              {user?.verificationStatus === 'verified' ? (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p className="text-[10px] leading-tight text-emerald-600/80">
                    Your identity has been verified. You have full access to authenticity reporting.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-[10px] leading-tight text-amber-600/80">
                    Your account is pending verification. Some features may be restricted.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs" 
                size="sm"
                onClick={() => toast.info("Password change feature coming soon")}
              >
                <Lock className="mr-2 h-3 w-3" />
                Change Password
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs text-red-500 hover:text-red-600" 
                size="sm"
                onClick={() => toast.info("Two-factor authentication coming soon")}
              >
                <Shield className="mr-2 h-3 w-3" />
                Two-Factor Auth
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
