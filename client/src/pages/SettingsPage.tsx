import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Bell, Lock, Eye, Key, Trash2, Loader2, Globe, Server, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function SettingsPage() {
  const { data: initialSettings, isLoading } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Forensic settings synchronized successfully");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const [settings, setSettings] = useState({
    language: "en-US",
    timezone: "UTC",
    notifications: {
      email: true,
      inApp: true,
      security: true,
    },
    publicProfile: true,
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleSave = () => {
    updateSettings.mutate(settings);
  };

  const updateNested = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings(s => ({
      ...s,
      notifications: { ...s.notifications, [key]: value }
    }));
  };

  const handleDeadButton = (feature: string) => {
    toast.info(`${feature} configuration is currently in read-only mode for this node.`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Shield className="h-3 w-3" />
            Configuration Console
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">Platform <span className="text-primary">Settings</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Manage your neural forensic workspace preferences.</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl mb-8">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black text-[10px] font-bold uppercase tracking-widest px-6">General</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black text-[10px] font-bold uppercase tracking-widest px-6">Alerts</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black text-[10px] font-bold uppercase tracking-widest px-6">Security</TabsTrigger>
          <TabsTrigger value="api" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black text-[10px] font-bold uppercase tracking-widest px-6">API</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-bold uppercase font-rajdhani tracking-tight text-white">Account Preferences</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Update your regional and identity node settings.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-8">
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Language</Label>
                  <select 
                    value={settings.language}
                    onChange={(e) => setSettings(s => ({ ...s, language: e.target.value }))}
                    className="flex h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 outline-none transition-all text-white"
                  >
                    <option value="en-US">English (US Cluster)</option>
                    <option value="en-UK">English (UK Cluster)</option>
                    <option value="es">Spanish (ES Cluster)</option>
                    <option value="fr">French (FR Cluster)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Temporal Zone</Label>
                  <select 
                    value={settings.timezone}
                    onChange={(e) => setSettings(s => ({ ...s, timezone: e.target.value }))}
                    className="flex h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 outline-none transition-all text-white"
                  >
                    <option value="UTC">UTC (GMT+0)</option>
                    <option value="EST">Eastern Time (US)</option>
                    <option value="CST">Central Time (US)</option>
                    <option value="PST">Pacific Time (US)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-white">Public Forensic Node</Label>
                  <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Allow other investigators to verify your credentials.</p>
                </div>
                <Switch 
                  checked={settings.publicProfile} 
                  onCheckedChange={(val) => setSettings(s => ({ ...s, publicProfile: val }))}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-bold uppercase font-rajdhani tracking-tight text-white">Alert Channels</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Choose how you want to be notified about forensic results.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Bell className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white">Email Protocols</Label>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Receive detailed forensic reports via encrypted email.</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifications.email} 
                  onCheckedChange={(val) => updateNested("email", val)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Eye className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white">Console Alerts</Label>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Show real-time forensic updates in the command center.</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifications.inApp} 
                  onCheckedChange={(val) => updateNested("inApp", val)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Shield className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white">Threat Alerts</Label>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Critical notifications regarding neural security breaches.</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifications.security} 
                  onCheckedChange={(val) => updateNested("security", val)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-bold uppercase font-rajdhani tracking-tight text-white">Security Protocol</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Protect your node with advanced neural security features.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Lock className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white">Multi-Factor Neural Auth</Label>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Add an extra layer of biometric or hardware verification.</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDeadButton("Multi-Factor Auth")}
                  className="h-10 px-6 border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-xl"
                >
                  Enable
                </Button>
              </div>
              <div className="flex items-center justify-between p-6 rounded-2xl bg-red-500/5 border border-red-500/10 mt-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-red-500">Terminate Node</Label>
                    <p className="text-[8px] text-red-500/60 font-bold uppercase tracking-widest">Permanently delete your account and all forensic history.</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeadButton("Account Termination")}
                  className="h-10 px-6 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl"
                >
                  Terminate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-bold uppercase font-rajdhani tracking-tight text-white">Developer Access</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manage your API keys for programmatic neural analysis.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operational API Key</Label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group">
                  <Key className="h-5 w-5 text-primary" />
                  <code className="text-[10px] font-mono flex-1 text-muted-foreground tracking-tighter">fs_live_neural_************************8a2f</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeadButton("API Key Revocation")}
                    className="h-8 text-[8px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                  >
                    Revoke
                  </Button>
                </div>
              </div>
              <Button 
                onClick={() => handleDeadButton("API Key Generation")}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
              >
                Generate New Neural Access Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-8 border-t border-white/5">
        <Button 
          variant="outline" 
          onClick={() => {
            setSettings(initialSettings || settings);
            toast.info("Settings reverted to latest neural baseline.");
          }}
          className="h-12 px-8 border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-xl"
        >
          Reset Defaults
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={updateSettings.isPending} 
          className="h-12 px-12 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 min-w-[160px]"
        >
          {updateSettings.isPending ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Syncing...
            </div>
          ) : "Synchronize Settings"}
        </Button>
      </div>
    </div>
  );
}
