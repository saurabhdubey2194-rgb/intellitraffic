import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Globe, Zap, BarChart3, ShieldAlert, Fingerprint, Lock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const globalTrends = trends?.trends || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Threat Intelligence</h1>
        <p className="text-muted-foreground">Real-time monitoring of global digital manipulation trends and emerging AI threats.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Active Threats</CardDescription>
            <CardTitle className="text-2xl font-bold">1,284</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-red-500">
              <Zap className="mr-1 h-3 w-3" />
              +12% from last 24h
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Detection Accuracy</CardDescription>
            <CardTitle className="text-2xl font-bold">99.4%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-emerald-500">
              <Shield className="mr-1 h-3 w-3" />
              Stable performance
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Scanned Objects</CardDescription>
            <CardTitle className="text-2xl font-bold">42.8k</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-blue-500">
              <Globe className="mr-1 h-3 w-3" />
              Global coverage
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>Mitigated Risks</CardDescription>
            <CardTitle className="text-2xl font-bold">15.2k</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-emerald-500">
              <Lock className="mr-1 h-3 w-3" />
              Protection active
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Threat Activity Timeline
            </CardTitle>
            <CardDescription>Daily volume of detected digital manipulations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={threatData}>
                  <defs>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area type="monotone" dataKey="threats" stroke="#3b82f6" fillOpacity={1} fill="url(#colorThreats)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Emerging AI Threats
            </CardTitle>
            <CardDescription>Global trends in AI-driven digital attacks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {globalTrends.map((trend, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border/20 pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{trend.type}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] py-0 h-4 border-red-500/20 text-red-400">
                        {trend.risk}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Global impact</span>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${trend.trend.startsWith('+') ? 'text-red-500' : 'text-emerald-500'}`}>
                    {trend.trend}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-purple-500" />
            Digital Fingerprint Analysis
          </CardTitle>
          <CardDescription>Recent suspicious artifacts identified across global scans.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Facial Temporal Jitter",
              "Audio Frequency Splicing",
              "GAN Edge Smoothing",
              "Lip-Sync Micro-Latency",
              "Text Urgency Obfuscation",
              "URL Homograph Attacks"
            ].map((artifact, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm">{artifact}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
