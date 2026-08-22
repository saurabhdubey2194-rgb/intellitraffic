import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Globe, Zap, BarChart3, ShieldAlert, Fingerprint, Lock, Loader2, Activity, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { trpc } from "@/lib/trpc";

const threatData = [
  { name: "Mon", threats: 45, blocked: 42 },
  { name: "Tue", threats: 52, blocked: 50 },
  { name: "Wed", threats: 89, blocked: 85 },
  { name: "Thu", threats: 64, blocked: 60 },
  { name: "Fri", threats: 78, blocked: 75 },
  { name: "Sat", threats: 34, blocked: 32 },
  { name: "Sun", threats: 28, blocked: 28 },
];

export default function ThreatIntelligencePage() {
  const { data: trends, isLoading } = trpc.threatIntel.getGlobalTrends.useQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Synchronizing with Global Threat Matrix...</p>
      </div>
    );
  }

  const globalTrends = trends?.trends || [];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Globe className="h-3 w-3" />
            Global Surveillance
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">Threat <span className="text-primary">Intelligence</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Real-time monitoring of global digital manipulation trends and emerging AI threats.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Risk Level</span>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Elevated
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <IntelCard title="Active Threats" value="1,284" icon={Zap} trend="+12%" trendColor="text-red-500" />
        <IntelCard title="Detection Accuracy" value="99.4%" icon={Shield} trend="Stable" trendColor="text-emerald-500" />
        <IntelCard title="Global Coverage" value="42.8k" icon={Globe} trend="Active" trendColor="text-blue-500" />
        <IntelCard title="Mitigated Risks" value="15.2k" icon={Lock} trend="Protected" trendColor="text-emerald-500" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              Threat Activity Timeline
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Daily volume of detected digital manipulations across the global matrix.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={threatData}>
                  <defs>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#07111F', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    itemStyle={{ color: '#2563EB' }}
                  />
                  <Area type="monotone" dataKey="threats" stroke="#2563EB" fillOpacity={1} fill="url(#colorThreats)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              Emerging AI Threats
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global trends in AI-driven digital attacks and neural exploits.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {globalTrends.map((trend, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0 group">
                  <div className="space-y-1">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-white group-hover:text-primary transition-colors">{trend.type}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-red-500/20 text-red-400 bg-red-500/5">
                        {trend.risk}
                      </Badge>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Global Impact Vector</span>
                    </div>
                  </div>
                  <div className={`text-xs font-black tracking-widest ${trend.trend.startsWith('+') ? 'text-red-500' : 'text-emerald-500'}`}>
                    {trend.trend}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
            <Fingerprint className="h-6 w-6 text-primary" />
            Neural Fingerprint Analysis
          </CardTitle>
          <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent suspicious artifacts identified across global scans.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Facial Temporal Jitter", color: "text-blue-500" },
              { label: "Audio Frequency Splicing", color: "text-emerald-500" },
              { label: "GAN Edge Smoothing", color: "text-amber-500" },
              { label: "Lip-Sync Micro-Latency", color: "text-purple-500" },
              { label: "Text Urgency Obfuscation", color: "text-red-500" },
              { label: "URL Homograph Attacks", color: "text-indigo-500" }
            ].map((artifact, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
                <div className={`h-2 w-2 rounded-full ${artifact.color.replace('text', 'bg')} shadow-[0_0_5px_currentColor]`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-primary transition-colors">{artifact.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IntelCard({ title, value, icon: Icon, trend, trendColor }: { title: string, value: string, icon: any, trend: string, trendColor: string }) {
  return (
    <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl group hover:border-primary/20 transition-all duration-500">
      <CardHeader className="pb-2 p-6">
        <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">{title}</CardDescription>
        <CardTitle className="text-3xl font-bold font-rajdhani text-white mt-1">{value}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className={`flex items-center text-[9px] font-black uppercase tracking-widest ${trendColor}`}>
          <Icon className="mr-2 h-3 w-3" />
          {trend}
        </div>
      </CardContent>
    </Card>
  );
}
