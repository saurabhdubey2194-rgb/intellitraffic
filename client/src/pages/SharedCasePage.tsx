import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  FileSearch, 
  Clock, 
  AlertTriangle, 
  Video,
  Image as ImageIcon,
  Info,
  Lock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SharedCasePage() {
  const { token } = useParams<{ token: string }>();
  const { data: caseDetails, isLoading, error } = trpc.cases.getSharedCase.useQuery({ token: token || "" });

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-20 px-4">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid md:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] md:col-span-2 rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !caseDetails) {
    return (
      <div className="py-40 text-center space-y-8 px-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
          <div className="relative h-24 w-24 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto">
            <Lock className="h-10 w-10 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-rajdhani uppercase tracking-tight text-white">Access Denied</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            This share link is invalid, expired, or has been revoked by the lead investigator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 max-w-6xl mx-auto pt-20 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <ShieldCheck className="h-3 w-3" />
            Shared Forensic Node
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">{caseDetails.case.title}</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Read-Only Forensic View</p>
        </div>
        
        <Badge variant="outline" className="h-12 px-6 border-white/10 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white">
          EXTERNAL ACCESS GRANTED
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Case Brief</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-widest">
                {caseDetails.case.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Evidence Nodes</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {caseDetails.evidence.length === 0 ? (
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center py-10">No evidence nodes linked.</p>
              ) : (
                <div className="grid gap-4">
                  {caseDetails.evidence.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5">
                      <div className="flex items-center gap-6">
                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center border ${
                          item.type === 'video' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : 
                          item.type === 'audio' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                          'bg-blue-500/10 border-blue-500/20 text-blue-500'
                        }`}>
                          {item.type === 'video' ? <Video className="h-7 w-7" /> : 
                           item.type === 'audio' ? <Clock className="h-7 w-7" /> : 
                           <ImageIcon className="h-7 w-7" />}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-[10px] uppercase tracking-widest text-white">{item.name}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
                            {item.type}
                          </p>
                        </div>
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
                Registry Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Initialized</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{new Date(caseDetails.case.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Evidence Nodes</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{caseDetails.evidence.length}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Access Mode</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">READ-ONLY</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
