import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, FileText, Download, Share2, ExternalLink, AlertTriangle, CheckCircle2, Info, Loader2, History } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

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
  const { data: results, isLoading: loadingResults } = trpc.analysis.results.useQuery(
    { jobId },
    { enabled: job?.status === "completed" }
  );

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            disabled={downloadMutation.isPending || job.status !== 'completed'}
          >
            {downloadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            PDF Report
          </Button>
        </div>
      </div>

      {isProcessing ? (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold capitalize">{job.status}...</h2>
              <p className="text-muted-foreground max-w-md">
                Our AI models are currently scanning the media for generative artifacts and digital inconsistencies.
              </p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              <Progress value={job.status === 'queued' ? 20 : job.status === 'preprocessing' ? 45 : 75} className="h-2" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Analysis in Progress</p>
            </div>
          </CardContent>
        </Card>
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
                <InfoRow label="File Name" value={job.media?.originalName || "N/A"} />
                <InfoRow label="Type" value={job.media?.type?.toUpperCase() || "N/A"} />
                <InfoRow label="Size" value={`${((job.media?.size || 0) / (1024 * 1024)).toFixed(2)} MB`} />
                <InfoRow label="Created At" value={new Date(job.createdAt).toLocaleString()} />
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add to New Case
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

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between text-xs py-1 border-b border-border/20 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
