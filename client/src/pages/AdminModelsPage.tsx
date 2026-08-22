import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cpu, Zap, Activity, ShieldCheck, AlertCircle, BarChart2 } from "lucide-react";

const models = [
  { name: "FS-Video-Forensics-v2", type: "Video", accuracy: 99.2, latency: "420ms", status: "online", load: 24 },
  { name: "FS-Image-Artifact-v4", type: "Image", accuracy: 98.8, latency: "180ms", status: "online", load: 12 },
  { name: "FS-Audio-Spectrogram-v1", type: "Audio", accuracy: 97.5, latency: "310ms", status: "online", load: 8 },
  { name: "FS-Text-Scam-NLP-v3", type: "Text", accuracy: 99.6, latency: "85ms", status: "online", load: 45 },
  { name: "FS-URL-Reputation-v2", type: "URL", accuracy: 99.9, latency: "12ms", status: "online", load: 68 },
];

export default function AdminModelsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Model Health</h1>
        <p className="text-muted-foreground">Monitor performance, accuracy, and load of detection models.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {models.map((model, i) => (
          <Card key={i} className="border-border/40 bg-black/20 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  {model.type}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  {model.status.toUpperCase()}
                </div>
              </div>
              <CardTitle className="text-lg mt-2">{model.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Accuracy</p>
                  <p className="text-lg font-bold">{model.accuracy}%</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Latency</p>
                  <p className="text-lg font-bold">{model.latency}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Current Load</span>
                  <span>{model.load}%</span>
                </div>
                <Progress value={model.load} className="h-1.5 bg-white/5" />
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-border/20">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Cpu className="h-3 w-3" />
                  GPU v100
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  High Avail
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Model Performance Benchmarks
          </CardTitle>
          <CardDescription>Comparison of detection accuracy across different media types.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {models.map((model, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-emerald-500">{model.accuracy}% Accuracy</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
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
