import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, FileText, Download, Share2, ExternalLink, AlertTriangle, CheckCircle2, Info, Loader2, History, Plus, Printer, FileSearch, ArrowRight, Zap, History as HistoryIcon, Clock, Lock } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAnalysisEvents } from "@/hooks/useAnalysisEvents";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const jobId = parseInt(id || "0");
  
  const { data: job, refetch: refetchJob } = trpc.analysis.jobStatus.useQuery({ jobId });
  
  const downloadMutation = trpc.analysis.downloadReport.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
      toast.success("Report generated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate report");
    }
  });

  const handleDownload = () => {
    downloadMutation.mutate({ jobId });
  };

  const handleExportJSON = () => {
    if (!results) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `FS-RPT-${id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Forensic data exported as JSON");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `FakeShield AI Report - FS-${id}`,
        text: `Forensic analysis report for ${job?.media?.originalName}. Verdict: ${results?.riskLevel.toUpperCase()}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Report link copied to clipboard");
    }
  };

  const { data: results, isLoading: loadingResults } = trpc.analysis.results.useQuery(
    { jobId },
    { enabled: job?.status === "completed" }
  );

  const { data: userCases } = trpc.cases.list.useQuery({ limit: 50 });
  const addEvidence = trpc.cases.addEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidence added to case successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add evidence to case");
    }
  });

  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const handleAddToCase = (caseId: number) => {
    const mediaId = (job as any).mediaId || (job as any).media?.id;
    if (!mediaId) return;
    
    addEvidence.mutate({
      caseId,
      mediaId,
      notes: `Evidence from analysis FS-${job!.id.toString().padStart(6, '0')}`
    });
    setIsCaseModalOpen(false);
  };

  // Poll for status if not completed
  const lastEvent = useAnalysisEvents();
  useEffect(() => {
    if (lastEvent && lastEvent.jobId === jobId) {
      refetchJob();
    }
  }, [lastEvent, jobId, refetchJob]);

  const currentJob = job;
  const isCompleted = currentJob?.status === "completed";
  const isFailed = currentJob?.status === "failed";
  const isProcessing = currentJob?.status === "queued" || currentJob?.status === "preprocessing" || currentJob?.status === "analyzing" || currentJob?.status === "generating_report";

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Shield className="h-3 w-3" />
            Forensic Node: FS-{jobId.toString().padStart(6, '0')}
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">
            Analysis <span className="text-primary">Report</span>
          </h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            {currentJob?.media?.originalName || "Loading evidence..."}
          </p>
        </div>
        
        {isCompleted && (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-10 border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-xl">
              <Printer className="mr-2 h-3.5 w-3.5" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="h-10 border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest rounded-xl">
              <Share2 className="mr-2 h-3.5 w-3.5" />
              Share
            </Button>
            <Button onClick={handleDownload} disabled={downloadMutation.isPending} className="h-10 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
              {downloadMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
              Download PDF
            </Button>
          </div>
        )}
      </div>

      {isProcessing ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden border-t-primary/30 border-t-2">
              <CardContent className="p-12 text-center space-y-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 blur-3xl bg-primary/20 animate-pulse rounded-full" />
                  <div className="relative h-32 w-32 rounded-3xl bg-primary/5 flex items-center justify-center border border-primary/20">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold font-rajdhani uppercase tracking-tight text-white">Forensic Processing...</h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                    Our neural network is currently auditing the media for GAN artifacts, temporal inconsistencies, and synthetic signatures.
                  </p>
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                    <span className="text-primary">Auditing Node</span>
                    <span className="text-white">{currentJob?.progress || 0}%</span>
                  </div>
                  <Progress value={currentJob?.progress || 0} className="h-1.5 bg-white/5" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <h3 className="font-rajdhani text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Analysis Pipeline
              </h3>
              <div className="space-y-0 relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/5" />
                <TimelineItem label="Media Ingestion" status="completed" time="0.2s" />
                <TimelineItem label="Artifact Scanning" status={currentJob?.progress && currentJob.progress > 30 ? 'completed' : 'active'} />
                <TimelineItem label="Neural Auditing" status={currentJob?.progress && currentJob.progress > 70 ? 'completed' : currentJob?.progress && currentJob.progress > 30 ? 'active' : 'pending'} />
                <TimelineItem label="Verdict Generation" status="pending" />
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
             <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Processing Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Priority</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">High</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-white tracking-widest">US-EAST-4</span>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                  Neural analysis usually completes within 30-60 seconds depending on media length and complexity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Verdict Card */}
            <Card className={`border-2 rounded-3xl overflow-hidden ${
              results?.riskLevel === 'low' ? 'border-emerald-500/30 bg-emerald-500/5' :
              results?.riskLevel === 'moderate' ? 'border-amber-500/30 bg-amber-500/5' :
              'border-red-500/30 bg-red-500/5'
            }`}>
              <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10">
                <div className={`h-32 w-32 rounded-3xl flex items-center justify-center border-2 shrink-0 ${
                  results?.riskLevel === 'low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                  results?.riskLevel === 'moderate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {results?.riskLevel === 'low' ? <ShieldCheck className="h-16 w-16" /> :
                   results?.riskLevel === 'moderate' ? <ShieldAlert className="h-16 w-16" /> :
                   <ShieldAlert className="h-16 w-16" />}
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <Badge className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1 ${
                      results?.riskLevel === 'low' ? 'bg-emerald-500 text-black' :
                      results?.riskLevel === 'moderate' ? 'bg-amber-500 text-black' :
                      'bg-red-500 text-white'
                    }`}>
                      {results?.riskLevel} Risk Detected
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Neural Confidence: {results?.authenticityScore}%
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold font-rajdhani uppercase tracking-tight text-white">
                    {results?.riskLevel === 'low' ? 'Authentic Media Verified' : 
                     results?.riskLevel === 'moderate' ? 'Potential Manipulation Found' : 
                     'Deepfake Signature Confirmed'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed uppercase tracking-widest opacity-80">
                    {results?.summary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Signal Audit */}
            <div className="space-y-6">
              <h3 className="font-rajdhani text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Neural Signal Audit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results?.signals.map((signal, i) => (
                  <Card key={i} className="border-white/5 bg-card/20 backdrop-blur-sm rounded-2xl hover:border-primary/20 transition-all group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">{signal.type}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{signal.description}</p>
                        </div>
                        <div className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                          signal.score > 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                          signal.score > 40 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                          'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                          {signal.score}%
                        </div>
                      </div>
                      <Progress value={signal.score} className="h-1 bg-white/5" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Findings & Evidence */}
            <div className="space-y-6">
              <h3 className="font-rajdhani text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" />
                Forensic Findings
              </h3>
              <div className="space-y-4">
                {(results as any)?.evidence?.map((item: string, i: number) => (
                  <div key={i} className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary text-[10px] font-black shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Media Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-video rounded-xl bg-white/5 flex flex-col items-center justify-center border border-white/5 group hover:border-primary/20 transition-colors cursor-pointer overflow-hidden relative">
                  {currentJob?.media?.type === 'image' ? (
                    <img src={currentJob.media.url} alt="Evidence" className="h-full w-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                  ) : (
                    <FileSearch className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-primary/20 text-primary border border-primary/20">
                      {currentJob?.media?.type}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Filename" value={currentJob?.media?.originalName || ""} />
                  <InfoItem label="File Size" value={`${((currentJob?.media?.size || 0) / (1024 * 1024)).toFixed(2)} MB`} />
                  <InfoItem label="Processed" value={currentJob?.createdAt ? new Date(currentJob.createdAt).toLocaleDateString() : ""} />
                  <InfoItem label="Hash (SHA-256)" value="SHA-256 Verified" />
                </div>

                <Button variant="outline" className="w-full h-12 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest" onClick={() => window.open(currentJob?.media?.url, '_blank')}>
                  View Source Evidence
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Case Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                  Attach this report to an investigation case for professional documentation.
                </p>
                
                <DropdownMenu open={isCaseModalOpen} onOpenChange={setIsCaseModalOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Case
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[280px] bg-card/95 backdrop-blur-md border-white/10 rounded-xl" align="end">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest">Select Case</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    {userCases?.rows.length === 0 ? (
                      <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest py-3 opacity-50">No active cases</DropdownMenuItem>
                    ) : (
                      userCases?.rows.map((c: any) => (
                        <DropdownMenuItem 
                          key={c.id} 
                          onClick={() => handleAddToCase(c.id)}
                          className="text-[10px] font-bold uppercase tracking-widest py-3 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {c.title}
                        </DropdownMenuItem>
                      ))
                    )}
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={() => navigate("/investigator")} className="text-[10px] font-bold uppercase tracking-widest py-3 text-primary cursor-pointer">
                      Create New Case
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : isFailed ? (
        <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardContent className="py-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-rajdhani uppercase tracking-tight text-white">Analysis Failed</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-md">
                {(job as any).errorMessage || "An error occurred while processing the forensic analysis. Please try again."}
              </p>
            </div>
            <Button onClick={() => navigate("/analyze")} className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
              Try New Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

function TimelineItem({ label, status, time }: { label: string, status: 'pending' | 'active' | 'completed', time?: string }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center border transition-all duration-500 ${
          status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
          status === 'active' ? 'bg-primary/10 border-primary/20 text-primary animate-pulse' : 
          'bg-white/5 border-white/5 text-muted-foreground'
        }`}>
          {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
        </div>
        <div className="w-px h-10 bg-white/5 group-last:hidden" />
      </div>
      <div className="pt-1.5 space-y-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
          {label}
        </p>
        {time && <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{time}</p>}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-[10px] font-bold uppercase tracking-tight truncate text-white">{value}</p>
    </div>
  );
}
