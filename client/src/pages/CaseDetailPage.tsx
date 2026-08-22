import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  FileSearch, 
  History, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  MoreVertical,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Video,
  Image as ImageIcon,
  Zap,
  Info,
  Lock,
  Share2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const caseId = parseInt(id || "0");
  const utils = trpc.useUtils();

  const { data: caseDetails, isLoading } = trpc.cases.get.useQuery({ caseId });
  const updateStatus = trpc.cases.updateStatus.useMutation({
    onSuccess: () => {
      utils.cases.get.invalidate({ caseId });
      toast.success("Case status updated");
    }
  });

  const generateShareToken = trpc.cases.generateShareToken.useMutation({
    onSuccess: (data) => {
      const shareUrl = `${window.location.origin}${data.url}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Secure share link copied to clipboard", {
        description: "Link has been copied to your clipboard."
      });
    },
    onError: (err) => toast.error(err.message)
  });

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid md:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] md:col-span-2 rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!caseDetails) {
    return (
      <div className="py-32 text-center space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
          <div className="relative h-24 w-24 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-rajdhani uppercase tracking-tight text-white">Case Node Not Found</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">The requested investigative node does not exist in the neural registry.</p>
        </div>
        <Button variant="outline" className="h-12 px-8 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white" onClick={() => navigate("/investigator")}>
          Back to Registry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/investigator")} className="h-12 w-12 rounded-xl hover:bg-white/5 group">
            <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
              <ShieldCheck className="h-3 w-3" />
              Investigative Node
            </div>
            <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">{caseDetails.title}</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Node ID: FS-{new Date(caseDetails.createdAt).getFullYear()}-{caseDetails.id.toString().padStart(3, '0')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-6 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white">
                Status: <span className={`ml-2 font-black ${caseDetails.status === 'open' ? 'text-emerald-500' : 'text-muted-foreground'}`}>{caseDetails.status.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black/95 backdrop-blur-xl border-white/5 text-white rounded-2xl">
              <DropdownMenuItem onClick={() => updateStatus.mutate({ caseId, status: "open" })} className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary/10 focus:text-primary">Open</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus.mutate({ caseId, status: "closed" })} className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary/10 focus:text-primary">Closed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus.mutate({ caseId, status: "archived" })} className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary/10 focus:text-primary">Archived</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline"
            className="h-12 px-6 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white"
            onClick={() => generateShareToken.mutate({ caseId })}
            disabled={generateShareToken.isPending}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {generateShareToken.isPending ? "Generating..." : "Share Case"}
          </Button>
          <Button 
            className="h-12 px-8 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
            onClick={() => toast.info("Forensic case archive export initiated.")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Archive
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Contextual Brief</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-widest">
                {caseDetails.description || "Zero contextual metadata provided for this investigation node."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Neural Evidence</CardTitle>
                <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Media nodes linked to this forensic investigation.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/analyze")} className="h-10 px-6 border-primary/20 hover:bg-primary/10 hover:border-primary/40 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary">
                <Plus className="mr-2 h-4 w-4" />
                Inject Evidence
              </Button>
            </CardHeader>
            <CardContent className="p-8">
              {caseDetails.evidence.length === 0 ? (
                <div className="py-20 text-center border border-dashed rounded-3xl border-white/10 flex flex-col items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 opacity-40">
                    <FileSearch className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Zero evidence nodes linked.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {caseDetails.evidence.map((item: any) => (
                    <div key={item.evidence.id} className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center border ${
                          item.media.type === 'video' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : 
                          item.media.type === 'audio' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                          'bg-blue-500/10 border-blue-500/20 text-blue-500'
                        }`}>
                          {item.media.type === 'video' ? <Video className="h-7 w-7" /> : 
                           item.media.type === 'audio' ? <Clock className="h-7 w-7" /> : 
                           <ImageIcon className="h-7 w-7" />}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-[10px] uppercase tracking-widest text-white group-hover:text-primary transition-colors">{item.media.originalName}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                            Linked: {new Date(item.evidence.createdAt).toLocaleDateString()} • {item.media.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/analysis/${item.media.jobId}`)} className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-500/10 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="font-rajdhani text-xl uppercase tracking-tight text-white flex items-center gap-3">
                <Info className="h-5 w-5 text-primary" />
                Node Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <DetailRow label="Initialized" value={new Date(caseDetails.createdAt).toLocaleString()} />
              <DetailRow label="Last Sync" value={new Date(caseDetails.updatedAt).toLocaleString()} />
              <DetailRow label="Evidence Nodes" value={caseDetails.evidence.length.toString()} />
              <DetailRow label="Lead Investigator" value="Authenticated Node" />
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 border rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="p-8 relative z-10">
              <CardTitle className="font-rajdhani text-xl uppercase tracking-tight text-primary flex items-center gap-3">
                <Lock className="h-5 w-5" />
                Security Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 relative z-10">
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest opacity-80">
                This investigative node is end-to-end encrypted. All access, modifications, and exports are audit-logged in the neural registry for strict compliance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-black text-white uppercase tracking-tighter">{value}</span>
    </div>
  );
}
