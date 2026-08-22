import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Activity, AlertTriangle, Cpu, HardDrive, Database, Globe, Zap, ShieldAlert, Lock, Terminal } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: usersData, isLoading: usersLoading } = trpc.admin.listUsers.useQuery({ limit: 5 });

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Shield className="h-3 w-3" />
            System Overview
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">Command <span className="text-primary">Center</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Global system-wide monitoring, analytics, and infrastructure health.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Network Status</span>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* Infrastructure Health */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <HealthCard title="Total Users" value={statsLoading ? "..." : stats?.totalUsers?.toString() || "0"} icon={Users} status="normal" />
        <HealthCard title="Neural Scans" value={statsLoading ? "..." : stats?.totalAnalyses?.toString() || "0"} icon={Activity} status="normal" />
        <HealthCard title="Active Cases" value={statsLoading ? "..." : stats?.totalCases?.toString() || "0"} icon={Shield} status="normal" />
        <HealthCard title="System Health" value={statsLoading ? "..." : stats?.systemHealth || "99.9%"} icon={Cpu} status="normal" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Model Performance */}
        <Card className="lg:col-span-2 border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              Neural Engine Performance
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Accuracy metrics for core detection engines across all nodes.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {[
              { name: 'Video GAN Detection', score: 98.2, icon: Activity },
              { name: 'Audio Splicing Engine', score: 96.5, icon: Terminal },
              { name: 'Image Artifact Scan', score: 94.8, icon: ShieldAlert },
              { name: 'Text Scam Classifier', score: 92.1, icon: Lock },
            ].map((model, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <model.icon className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{model.name}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-500 tracking-widest">{model.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] rounded-full transition-all duration-1000" style={{ width: `${model.score}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              Security Alerts
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent suspicious activity and system warnings.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {statsLoading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-14 w-full animate-pulse bg-white/5 rounded-xl" />)
              ) : stats?.recentAlerts && stats.recentAlerts.length > 0 ? (
                stats.recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/20 transition-all group">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${alert.action.includes('FAILED') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white truncate">{alert.action.replace('fs_', '').replace('_', ' ')}</p>
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter mt-0.5">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center border border-dashed rounded-3xl border-white/10 flex flex-col items-center gap-4">
                  <Shield className="h-8 w-8 text-muted-foreground opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Zero security breaches detected.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* API Usage Monitoring */}
        <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary" />
              API Monitoring
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live traffic and endpoint performance.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-3">
              {statsLoading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-10 w-full animate-pulse bg-white/5 rounded-xl" />)
              ) : stats?.apiUsage && stats.apiUsage.length > 0 ? (
                stats.apiUsage.map((usage: any) => (
                  <div key={usage.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-[8px] bg-black/50 border-white/10 text-primary">{usage.method}</Badge>
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground group-hover:text-white transition-colors truncate max-w-[100px]">{usage.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black ${usage.statusCode >= 400 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {usage.statusCode}
                      </span>
                      <span className="text-[8px] font-bold text-muted-foreground">{usage.responseTime}ms</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center border border-dashed rounded-3xl border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No traffic logs.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resource Monitoring */}
        <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <HardDrive className="h-6 w-6 text-primary" />
              Resource Nodes
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CPU, Memory, and Storage distribution.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {[
              { name: 'Forensic Engine CPU', score: 45.2, color: 'bg-blue-500' },
              { name: 'Database Memory', score: 62.5, color: 'bg-emerald-500' },
              { name: 'S3 Storage Bucket', score: 12.8, color: 'bg-amber-500' },
              { name: 'Network Ingress', score: 28.1, color: 'bg-indigo-500' },
            ].map((res, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-white">{res.name}</span>
                  <span className="text-muted-foreground">{res.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${res.color} rounded-full transition-all duration-1000`} style={{ width: `${res.score}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Failed Job Review */}
        <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <Terminal className="h-6 w-6 text-red-500" />
              Fault Logs
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent processing errors requiring attention.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {statsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 w-full animate-pulse bg-white/5 rounded-xl" />)
              ) : stats?.failedJobs && stats.failedJobs.length > 0 ? (
                stats.failedJobs.map((job: any) => (
                  <div key={job.id} className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-2 group hover:bg-red-500/10 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white truncate group-hover:text-red-400 transition-colors">{job.mediaName}</p>
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter mt-0.5">Node: {job.userName}</p>
                      </div>
                      <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-widest h-5 px-2 bg-red-500/20 border-red-500/30 text-red-500">FAULT</Badge>
                    </div>
                    <p className="text-[8px] text-red-400 font-mono line-clamp-1 opacity-70 group-hover:opacity-100">{job.errorMessage}</p>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center border border-dashed rounded-3xl border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Zero processing faults.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HealthCard({ title, value, icon: Icon, status }: { title: string, value: string, icon: any, status: "normal" | "warning" | "critical" }) {
  return (
    <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl group hover:border-primary/20 transition-all duration-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="text-3xl font-bold font-rajdhani text-white">{value}</div>
        <div className="flex items-center gap-2 mt-3">
          <div className={`h-1.5 w-1.5 rounded-full ${status === 'normal' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]'} animate-pulse`} />
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{status} node</span>
        </div>
      </CardContent>
    </Card>
  );
}
