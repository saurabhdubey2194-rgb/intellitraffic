import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, ExternalLink, AlertTriangle, CheckCircle2, ShieldAlert, Zap, Clock, Shield, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminScansPage() {
  const utils = trpc.useUtils();
  const { data: scans, isLoading } = trpc.admin.listAllScans.useQuery({ limit: 50 });

  const deleteScan = trpc.admin.deleteScan.useMutation({
    onSuccess: () => {
      utils.admin.listAllScans.invalidate();
      toast.success("Scan registry node purged successfully");
    },
    onError: (err) => toast.error(err.message)
  });

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Shield className="h-3 w-3" />
            Forensic Surveillance
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">Scan <span className="text-primary">Monitoring</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Real-time surveillance of all platform analysis activity and high-risk detections.</p>
        </div>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Global Forensic Stream</CardTitle>
              <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Unified overview of all neural media processed by FakeShield AI.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Search scan logs..." className="pl-10 h-10 w-[200px] md:w-[300px] bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 text-white" />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-white/10 hover:bg-white/5">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scan ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Media Node</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Risk Vector</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Forensic Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sync Date</TableHead>
                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={7} className="h-16 px-8">
                      <div className="h-4 w-full bg-white/5 animate-pulse rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                scans?.rows.map((row: any) => (
                  <TableRow key={row.job.id} className="border-white/5 group hover:bg-white/5 transition-all">
                    <TableCell className="px-8 font-mono text-[10px] font-bold text-primary tracking-tighter">
                      SCAN-{row.job.id.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate py-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[10px] uppercase tracking-widest text-white group-hover:text-primary transition-colors">{row.media?.originalName || "Unnamed Node"}</span>
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">Owner: {row.user?.name || "System"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-white/10 text-muted-foreground">
                        {row.media?.type || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-white/10 ${
                        row.result?.riskLevel === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        row.result?.riskLevel === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                        row.result?.riskLevel === 'moderate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {row.result?.riskLevel?.toUpperCase() || "PENDING"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                        {row.job.status === 'completed' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : row.job.status === 'failed' ? (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                        <span className={row.job.status === 'completed' ? 'text-emerald-500' : 'text-primary'}>{row.job.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {format(new Date(row.job.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <div className="flex justify-end gap-1">
                        <Link href={`/analysis/${row.job.id}`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => {
                            if (confirm("Purge this scan from neural registry?")) {
                              deleteScan.mutate({ jobId: row.job.id });
                            }
                          }}
                          disabled={deleteScan.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
