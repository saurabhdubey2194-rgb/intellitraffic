import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, FileText, Download, Share2, ExternalLink, AlertTriangle, CheckCircle2, Info, Loader2, History, Plus, Printer } from "lucide-react";
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
        text: `Forensic analysis report for ${currentJob.media?.originalName}. Verdict: ${results?.riskLevel.toUpperCase()}`,
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
    // job object from jobStatus query includes media object but not raw mediaId directly in some shapes
    // we need the media ID which is job.media.id in the joined result
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
  useEffect(() => {
    let interval: any;
    if (job && (job.status === "queued" || job.status === "preprocessing" || job.status === "analyzing")) {
      interval = setInterval(() => {
        refetchJob();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [job?.status]);

  if (!job) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const isCompleted = job.status === "completed";
  const isProcessing = ["queued", "preprocessing", "analyzing"].includes(job.status);
  const lastEvent = useAnalysisEvents();
  
  // Update local job state if event matches this job
  const [currentJob, setCurrentJob] = useState<any>(job);
  
  useEffect(() => {
    if (lastEvent && lastEvent.jobId === jobId) {
      setCurrentJob((prev: any) => ({
        ...prev,
        status: lastEvent.status,
        progress: lastEvent.progress || prev?.progress,
        message: lastEvent.message
      }));
      if (lastEvent.status === 'completed') {
        refetchJob();
      }
    }
  }, [lastEvent, jobId, refetchJob]);

  useEffect(() => {
    setCurrentJob(job);
  }, [job]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <History className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analysis Report</h1>
            <p className="text-muted-foreground">Report ID: FS-{job.id.toString().padStart(6, '0')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handleShare} disabled={!isCompleted}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!isCompleted}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON} disabled={!isCompleted}>
            <FileText className="mr-2 h-4 w-4" />
            JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            disabled={downloadMutation.isPending || job.status !== 'completed'}
          >
            {downloadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            PDF
          </Button>
        </div>
      </div>

      {isProcessing ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-blue-500/20 bg-blue-500/5">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold capitalize">{currentJob.status}...</h2>
                <p className="text-muted-foreground max-w-md">
                  {currentJob.message || "Our AI models are currently scanning the media for generative artifacts and digital inconsistencies."}
                </p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                <Progress value={currentJob.progress || (currentJob.status === 'queued' ? 10 : currentJob.status === 'preprocessing' ? 30 : 60)} className="h-2" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Live Analysis Timeline</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Analysis Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <TimelineItem 
                  label="Media Queued" 
                  status={currentJob.status === 'queued' ? 'active' : 'completed'} 
                  time={new Date(currentJob.createdAt).toLocaleTimeString()}
                />
                <TimelineItem 
                  label="Preprocessing" 
                  status={['queued'].includes(currentJob.status) ? 'pending' : currentJob.status === 'preprocessing' ? 'active' : 'completed'} 
                />
                <TimelineItem 
                  label="Forensic Analysis" 
                  status={['queued', 'preprocessing'].includes(currentJob.status) ? 'pending' : currentJob.status === 'analyzing' ? 'active' : 'completed'} 
                />
                <TimelineItem 
                  label="Report Generation" 
                  status={currentJob.status === 'completed' ? 'completed' : 'pending'} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : isCompleted && results ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Results */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-border/40 overflow-hidden">
              <div className={`h-2 w-full ${
                results.riskLevel === 'high' || results.riskLevel === 'critical' ? 'bg-red-500' : 
                results.riskLevel === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Authenticity Score</CardTitle>
                  <CardDescription>Overall confidence in media authenticity.</CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-black ${
                    results.riskLevel === 'high' || results.riskLevel === 'critical' ? 'text-red-500' : 
                    results.riskLevel === 'moderate' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {results.authenticityScore}%
                  </div>
                  <Badge variant={results.riskLevel === 'high' || results.riskLevel === 'critical' ? 'destructive' : 'secondary'} className="mt-1">
                    {results.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Executive Summary
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    "{results.summary}"
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold">Forensic Signals</h4>
                    <div className="grid gap-3">
                      {results.signals.map((signal: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg border border-border/40 bg-card space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{signal.type}</span>
                            <span className={`text-xs font-bold ${signal.score > 80 ? 'text-emerald-500' : signal.score > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                              {signal.score}% Match
                            </span>
                          </div>
                          <Progress value={signal.score} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">{signal.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold">Forensic Evidence</h4>
                    <div className="grid gap-3">
                      {(results as any).evidence?.length > 0 ? (results as any).evidence.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-blue-500">{item.type}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{item.location}</span>
                          </div>
                          <p className="text-xs leading-relaxed">{item.description}</p>
                        </div>
                      )) : (
                        <div className="py-8 text-center border border-dashed rounded-lg border-border/40">
                          <p className="text-xs text-muted-foreground">No localized evidence identified.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {(results as any).recommendations?.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border/40">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Recommended Actions
                    </h4>
                    <div className="grid gap-2">
                      {(results as any).recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-emerald-500 mt-1.5" />
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="text-base">Media Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border border-border/40 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground opacity-20" />
                </div>
                <InfoRow label="File Name" value={currentJob.media?.originalName || "N/A"} />
                <InfoRow label="Type" value={currentJob.media?.type?.toUpperCase() || "N/A"} />
                <InfoRow label="Size" value={`${((currentJob.media?.size || 0) / (1024 * 1024)).toFixed(2)} MB`} />
                <InfoRow label="Status" value={currentJob.status.toUpperCase()} />
                <InfoRow label="Created At" value={new Date(currentJob.createdAt).toLocaleString()} />
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full justify-start" variant="outline" size="sm" disabled={!userCases || userCases.rows.length === 0}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Case
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Select Case</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userCases?.rows.map((c: any) => (
                      <DropdownMenuItem key={c.id} onClick={() => handleAddToCase(c.id)}>
                        {c.title}
                      </DropdownMenuItem>
                    ))}
                    {(!userCases || userCases.rows.length === 0) && (
                      <DropdownMenuItem disabled>No active cases</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button className="w-full justify-start" variant="outline" size="sm" onClick={() => navigate("/cases")}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Manage Cases
                </Button>
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Report Abuse
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Analysis Failed</h2>
          <p className="text-muted-foreground">There was an error processing this media file.</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/analyze")}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ label, status, time }: { label: string, status: 'pending' | 'active' | 'completed', time?: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 ${
          status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
          status === 'active' ? 'bg-blue-500 border-blue-500 text-white animate-pulse' :
          'bg-muted border-muted-foreground/20 text-muted-foreground'
        }`}>
          {status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : 
           status === 'active' ? <Loader2 className="h-3 w-3 animate-spin" /> : 
           <div className="h-1.5 w-1.5 rounded-full bg-current" />}
        </div>
        <div className="w-0.5 h-full bg-border mt-1" />
      </div>
      <div className="pb-6">
        <p className={`text-sm font-bold ${status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>{label}</p>
        {time && <p className="text-[10px] text-muted-foreground">{time}</p>}
        {status === 'active' && <p className="text-[10px] text-blue-500 font-medium">Processing...</p>}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between text-xs py-1 border-b border-border/20 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}


