import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Database, Activity, HardDrive, RefreshCw, ShieldCheck, Globe, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminSystemPage() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: health, isLoading: healthLoading } = trpc.admin.systemHealth.useQuery();

  const services = health?.services.map(s => ({
    ...s,
    uptime: "Active",
    icon: s.name.includes("API") ? Globe : s.name.includes("Worker") ? Zap : Database
  })) || [];

  const isLoading = statsLoading || healthLoading;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Infrastructure</h1>
          <p className="text-muted-foreground">Monitor platform health, service status, and resource utilization.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-500">
          <RefreshCw className="mr-2 h-4 w-4" />
          Restart All Services
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Overall Uptime</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats?.systemHealth || "99.99%"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-emerald-500">
              <ShieldCheck className="mr-1 h-3 w-3" />
              All systems operational
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Storage Utilization</CardDescription>
            <CardTitle className="text-2xl font-bold">{stats?.storageUsed || "1.2 TB"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-blue-500">
              <HardDrive className="mr-1 h-3 w-3" />
              64% of 2.0 TB capacity
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Database Connections</CardDescription>
            <CardTitle className="text-2xl font-bold">142</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-emerald-500">
              <Database className="mr-1 h-3 w-3" />
              Within healthy limits
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            Service Status Matrix
          </CardTitle>
          <CardDescription>Real-time health monitoring of distributed platform services.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((service, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <service.icon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 mb-1">
                    {service.status.toUpperCase()}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground">Latency: {service.latency}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
