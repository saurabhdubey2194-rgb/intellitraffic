import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cpu, Zap, Activity, ShieldCheck, AlertCircle, BarChart2, Server, Database, Globe, Lock } from "lucide-react";

const models = [
  { name: "FS-Video-Forensics-v2", type: "Video", accuracy: 99.2, latency: "420ms", status: "online", load: 24, icon: Activity },
  { name: "FS-Image-Artifact-v4", type: "Image", accuracy: 98.8, latency: "180ms", status: "online", load: 12, icon: ShieldCheck },
  { name: "FS-Audio-Spectrogram-v1", type: "Audio", accuracy: 97.5, latency: "310ms", status: "online", load: 8, icon: Zap },
  { name: "FS-Text-Scam-NLP-v3", type: "Text", accuracy: 99.6, latency: "85ms", status: "online", load: 45, icon: Lock },
  { name: "FS-URL-Reputation-v2", type: "URL", accuracy: 99.9, latency: "12ms", status: "online", load: 68, icon: Globe },
];

export default function AdminModelsPage() {
  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Cpu className="h-3 w-3" />
            Neural Infrastructure
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">Model <span className="text-primary">Health</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Monitor performance, accuracy, and load of detection models.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Compute Capacity</span>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Optimal
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {models.map((model, i) => (
          <Card key={i} className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden group hover:border-primary/20 transition-all duration-500">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-white/10 bg-black/50 text-primary">
                  {model.type}
                </Badge>
                <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  {model.status}
                </div>
              </div>
              <CardTitle className="font-rajdhani text-xl uppercase tracking-tight text-white group-hover:text-primary transition-colors flex items-center gap-3">
                <model.icon className="h-5 w-5" />
                {model.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Precision</p>
                  <p className="text-2xl font-bold font-rajdhani text-white">{model.accuracy}%</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Latency</p>
                  <p className="text-2xl font-bold font-rajdhani text-white">{model.latency}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground">Neural Load</span>
                  <span className="text-white">{model.load}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] rounded-full transition-all duration-1000" 
                    style={{ width: `${model.load}%` }} 
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                  <Server className="h-3 w-3 text-primary" />
                  Node: GPU-v100
                </div>
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  High-Avail
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
            <BarChart2 className="h-6 w-6 text-primary" />
            Performance Benchmarks
          </CardTitle>
          <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Comparison of detection accuracy across different neural media types.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-8">
            {models.map((model, i) => (
              <div key={i} className="space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <model.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{model.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{model.accuracy}% Precision</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] rounded-full transition-all duration-1000" 
                    style={{ width: `${model.accuracy}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
