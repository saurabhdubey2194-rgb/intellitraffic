import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, Image as ImageIcon, Video, Music, X, AlertCircle, Loader2, CheckCircle2, ArrowRight, FileSearch, Globe, Shield, Search, Zap, History, Lock, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export default function AnalyzePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: profile } = trpc.auth.profile.useQuery();
  const { data: recentJobs } = trpc.analysis.list.useQuery({ limit: 3 });
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startAnalysis = trpc.analysis.upload.useMutation({
    onSuccess: (data) => {
      toast.success("Media successfully uploaded to neural registry");
      navigate(`/analysis/${data.jobId}`);
    },
    onError: (err) => {
      setUploading(false);
      setProgress(0);
      toast.error(err.message || "Forensic upload failed");
    }
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  }, []);

  const validateAndSetFile = (f: File) => {
    const validTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'text/plain'];
    const isValid = validTypes.some(t => f.type.startsWith(t));
    
    if (!isValid) {
      return toast.error("Invalid media type. Please provide supported forensic evidence.");
    }
    
    if (f.size > 50 * 1024 * 1024) {
      return toast.error("File size exceeds 50MB neural gateway limit.");
    }
    
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 95) {
        clearInterval(interval);
        setProgress(95);
      } else {
        setProgress(p);
      }
    }, 200);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const getForensicType = (mime: string): "text" | "image" | "video" | "audio" | "url" | "document" => {
          if (mime.startsWith('video/')) return 'video';
          if (mime.startsWith('audio/')) return 'audio';
          if (mime.startsWith('image/')) return 'image';
          if (mime === 'application/pdf') return 'document';
          return 'text';
        };

        startAnalysis.mutate({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          base64: base64.split(',')[1],
          type: getForensicType(file.type)
        });
        clearInterval(interval);
        setProgress(100);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      clearInterval(interval);
      setUploading(false);
      setProgress(0);
      toast.error("Failed to read evidence node.");
    }
  };

  return (
    <div className="space-y-12 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Zap className="h-3 w-3" />
            Neural Gateway
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">Forensic <span className="text-primary">Analysis</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Inject media nodes into the neural detection engine for deepfake verification.</p>
        </div>
        
        {profile?.usage && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Neural Quota</span>
              <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary bg-primary/5">
                {profile.usage.remaining} Scans Left
              </Badge>
            </div>
            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${(profile.usage.used / profile.usage.limit) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Evidence Injection</CardTitle>
              <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Supported formats: Video, Audio, Images, PDF, Text (Max 50MB)</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {!file ? (
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className="group relative border-2 border-dashed border-white/5 rounded-[2.5rem] p-20 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-500 cursor-pointer overflow-hidden"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                  />
                  <div className="relative z-10 space-y-6">
                    <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                      <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold font-rajdhani uppercase tracking-tight text-white">Drop Evidence Node Here</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">or click to browse local filesystem</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="p-8 rounded-[2.5rem] border border-primary/20 bg-primary/5 flex items-center justify-between group relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-50" />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        {file.type.startsWith('video') ? <Video className="h-8 w-8 text-primary" /> : 
                         file.type.startsWith('audio') ? <Music className="h-8 w-8 text-primary" /> : 
                         <ImageIcon className="h-8 w-8 text-primary" />}
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold font-rajdhani text-xl tracking-tight uppercase text-white">{file.name}</p>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}</p>
                      </div>
                    </div>
                    {!uploading && (
                      <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="h-12 w-12 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all relative z-10">
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </div>

                  {uploading ? (
                    <div className="space-y-6 p-8 rounded-3xl bg-white/5 border border-white/5">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Neural Upload in Progress</p>
                          <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Syncing with forensic clusters...</p>
                        </div>
                        <span className="text-xl font-bold font-rajdhani text-white">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-white/5" />
                    </div>
                  ) : (
                    <Button 
                      onClick={handleUpload} 
                      className="w-full h-16 bg-primary hover:bg-primary/90 text-black text-xs font-bold uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                      Initialize Neural Analysis
                      <ArrowRight className="ml-3 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Recent Archive</CardTitle>
                <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Your latest forensic scan nodes.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-primary/10">
                View All History
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {recentJobs?.rows.map((job: any) => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate(`/analysis/${job.id}`)}
                    className="p-6 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-primary/20 transition-all">
                        <FileSearch className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-[10px] uppercase tracking-widest text-white group-hover:text-primary transition-colors">{job.media?.originalName}</p>
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">{new Date(job.createdAt).toLocaleDateString()} • {job.media?.type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                      job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      job.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="font-rajdhani text-xl uppercase tracking-tight text-white flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Detection Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <ProtocolStep icon={<Globe className="h-4 w-4" />} title="Neural Mapping" desc="Media is decomposed into forensic primitives." />
                <ProtocolStep icon={<Search className="h-4 w-4" />} title="Artifact Scanning" desc="Detection of GAN artifacts and neural jitters." />
                <ProtocolStep icon={<Lock className="h-4 w-4" />} title="Hash Verification" desc="Integrity check against known manipulation patterns." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 border rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="p-8 relative z-10">
              <CardTitle className="font-rajdhani text-xl uppercase tracking-tight text-primary flex items-center gap-3">
                <ShieldAlert className="h-5 w-5" />
                Explainable AI
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 relative z-10">
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest opacity-80">
                Our forensic reports provide detailed evidence maps, identifying exactly where and why our neural engine flagged a manipulation risk.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProtocolStep({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex gap-4 group/step">
      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover/step:border-primary/30 transition-all">
        <div className="text-muted-foreground group-hover/step:text-primary transition-colors">{icon}</div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-white group-hover/step:text-primary transition-colors">{title}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed opacity-60">{desc}</p>
      </div>
    </div>
  );
}
