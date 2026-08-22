import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Database, Activity, HardDrive, RefreshCw, ShieldCheck, Globe, Zap, Cpu, Terminal } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminSystemPage() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: health, isLoading: healthLoading } = trpc.admin.systemHealth.useQuery();

  const services = health?.services.map(s => ({
    ...s,
    uptime: "Active",
    icon: s.name.includes("API") ? Globe : s.name.includes("Worker") ? Zap : Database
  })) || [];

  const handleRestart = () => {
    toast.info("Neural node synchronization is managed automatically by the core grid.");
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Server className="h-3 w-3" />
            Infrastructure Matrix
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">System <span className="text-primary">Health</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Monitor platform health, service status, and resource utilization.</p>
        </div>
        
        <Button onClick={handleRestart} className="h-12 px-8 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
          <RefreshCw className="mr-2 h-4 w-4" />
          Synchronize All Nodes
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <SystemCard title="Overall Uptime" value={stats?.systemHealth || "99.99%"} icon={ShieldCheck} status="Optimal" statusColor="text-emerald-500" />
        <SystemCard title="Storage Utilization" value={stats?.storageUsed || "1.2 TB"} icon={HardDrive} status="64% Capacity" statusColor="text-blue-500" />
        <SystemCard title="Active Connections" value="142" icon={Database} status="Within Limits" statusColor="text-emerald-500" />
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
            <Terminal className="h-6 w-6 text-primary" />
            Distributed Service Matrix
          </CardTitle>
          <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Real-time health monitoring of distributed neural platform services.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            {healthLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-24 w-full animate-pulse bg-white/5 rounded-2xl" />)
            ) : services.map((service, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-white group-hover:text-primary transition-colors">{service.name}</p>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">Uptime: {service.uptime}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                    {service.status}
                  </Badge>
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Latency: {service.latency}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemCard({ title, value, icon: Icon, status, statusColor }: { title: string, value: string, icon: any, status: string, statusColor: string }) {
  return (
    <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl group hover:border-primary/20 transition-all duration-500">
      <CardHeader className="pb-2 p-8">
        <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">{title}</CardDescription>
        <CardTitle className="text-3xl font-bold font-rajdhani text-white mt-2">{value}</CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className={`flex items-center text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
          <Icon className="mr-2 h-3 w-3" />
          {status}
        </div>
      </CardContent>
    </Card>
  );
}
