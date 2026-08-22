import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Bell, Lock, Eye, Server, Database, Key, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export default function SettingsPage() {
  const { data: initialSettings, isLoading } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and system security configurations.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-black/20 border border-border/40 p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-600">General</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">Security</TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-blue-600">API Access</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Account Preferences</CardTitle>
              <CardDescription>Update your personal information and regional settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="language">Display Language</Label>
                <select id="language" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select id="timezone" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>UTC (GMT+0)</option>
                  <option>Eastern Time (US & Canada)</option>
                  <option>Central Time (US & Canada)</option>
                  <option>Pacific Time (US & Canada)</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-xs text-muted-foreground">Allow other investigators to see your profile.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Alert Channels</CardTitle>
              <CardDescription>Choose how you want to be notified about scan results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <Label>Email Notifications</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Receive detailed reports via email.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <Label>In-App Alerts</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Show real-time notifications in the dashboard.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    <Label>Security Alerts</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Critical notifications about account security.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Security Settings</CardTitle>
              <CardDescription>Protect your account with advanced security features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-orange-500" />
                    <Label>Two-Factor Authentication</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between border-t border-border/20 pt-6">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <Label className="text-red-500">Delete Account</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Permanently remove your account and all data.</p>
                </div>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6 space-y-6">
          <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Developer Access</CardTitle>
              <CardDescription>Manage your API keys for programmatic forensic analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Active API Keys</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                  <Key className="h-4 w-4 text-blue-500" />
                  <code className="text-xs flex-1">fs_live_************************8a2f</code>
                  <Button variant="ghost" size="sm">Revoke</Button>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-500">Generate New API Key</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="bg-blue-600 hover:bg-blue-500 min-w-[120px]">
          {updateSettings.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
