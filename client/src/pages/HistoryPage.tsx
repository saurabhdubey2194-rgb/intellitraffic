import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, ArrowUpRight, CheckCircle2, AlertTriangle, Clock, MoreVertical, FileSearch, Shield, History, Zap, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const { data: jobs, isLoading, refetch } = trpc.analysis.list.useQuery({ limit: 50 });

  const filteredJobs = jobs?.rows.filter((job: any) => 
    job.media?.originalName?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <History className="h-3 w-3" />
            Analysis Archive
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">Neural <span className="text-primary">History</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Review and manage your past digital authenticity reports.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Archive Status</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              {filteredJobs.length} Records Indexed
            </span>
          </div>
        </div>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl">
        <CardHeader className="p-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-sm group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="SEARCH ARCHIVE..." 
                className="pl-12 h-14 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest placeholder:text-muted-foreground/50 focus:border-primary/50 transition-all" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest">
                <Filter className="mr-2 h-4 w-4" />
                Filter Engine
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-40 text-center space-y-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative h-24 w-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 mx-auto group hover:scale-110 transition-transform duration-500">
                  <FileSearch className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold font-rajdhani uppercase tracking-tight text-2xl text-white">No Records Found</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">The neural archive is currently empty for the given parameters.</p>
              </div>
              <Button onClick={() => navigate("/analyze")} className="bg-primary hover:bg-primary/90 text-black h-14 px-10 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                Launch New Analysis
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="w-[350px] text-[10px] font-black uppercase tracking-widest py-8 pl-10 text-muted-foreground">Evidence Media</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 text-muted-foreground">Forensic Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 text-muted-foreground">Index Date</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest py-8 pr-10 text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job: any) => (
                  <TableRow key={job.id} className="group border-white/5 hover:bg-white/5 transition-all cursor-pointer" onClick={() => navigate(`/analysis/${job.id}`)}>
                    <TableCell className="py-8 pl-10">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                          <FileSearch className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold font-rajdhani text-lg tracking-tight uppercase block truncate max-w-[200px] text-white group-hover:text-primary transition-colors">{job.media?.originalName}</span>
                          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block opacity-60">{job.media?.type} • {(job.media?.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-8">
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="py-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-8 text-right pr-10">
                      <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => navigate(`/analysis/${job.id}`)}>
                          <ArrowUpRight className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all" onClick={() => toast.info("Delete feature coming soon")}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-[0.2em]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verified
        </div>
      );
    case 'failed':
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400 text-[8px] font-black uppercase tracking-[0.2em]">
          <AlertTriangle className="h-3.5 w-3.5" />
          Critical
        </div>
      );
    case 'analyzing':
    case 'preprocessing':
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.2em]">
          <Clock className="h-3.5 w-3.5 animate-pulse" />
          {status}
        </div>
      );
    default:
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-[8px] font-black uppercase tracking-[0.2em]">
          <Clock className="h-3.5 w-3.5" />
          In Queue
        </div>
      );
  }
}
