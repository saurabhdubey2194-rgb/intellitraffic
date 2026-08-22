import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSearch, FolderPlus, Shield, Clock, AlertTriangle, CheckCircle2, MoreHorizontal, Filter, Search, Loader2, ChevronRight, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function InvestigatorDashboardPage() {
  const [, navigate] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCase, setNewCase] = useState({ title: "", description: "" });
  
  const utils = trpc.useUtils();
  const { data: stats, isLoading: statsLoading } = trpc.cases.stats.useQuery();
  const { data: casesData, isLoading: casesLoading } = trpc.cases.list.useQuery({ limit: 10 });

  const createCase = trpc.cases.create.useMutation({
    onSuccess: (data) => {
      toast.success("Case created successfully");
      setIsCreateOpen(false);
      setNewCase({ title: "", description: "" });
      utils.cases.list.invalidate();
      utils.cases.stats.invalidate();
      navigate(`/cases/${data.id}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create case");
    }
  });

  const handleCreate = () => {
    if (!newCase.title.trim()) {
      toast.error("Case title is required");
      return;
    }
    createCase.mutate(newCase);
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Shield className="h-3 w-3" />
            Investigator Workspace
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">Case <span className="text-primary">Manager</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Manage forensic investigations and organize neural evidence.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
              <FolderPlus className="mr-2 h-4 w-4" />
              Initialize New Case
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/95 backdrop-blur-xl border-white/5 text-white rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-rajdhani text-2xl uppercase tracking-tight">Create Investigation Case</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Start a new case to organize media files and forensic evidence.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Case Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g., Q3 Election Disinformation Campaign" 
                  value={newCase.title}
                  onChange={(e) => setNewCase(prev => ({ ...prev, title: e.target.value }))}
                  className="h-12 bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Contextual Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Provide context for this investigation..." 
                  value={newCase.description}
                  onChange={(e) => setNewCase(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-12 px-6 text-[10px] font-bold uppercase tracking-widest rounded-xl">Cancel</Button>
              <Button 
                onClick={handleCreate} 
                disabled={createCase.isPending}
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
              >
                {createCase.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Commit Case
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Case Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Active Cases" value={statsLoading ? "..." : stats?.openCases?.toString() || "0"} icon={Clock} variant="blue" />
        <StatCard title="Critical Priority" value={statsLoading ? "..." : stats?.highPriority?.toString() || "0"} icon={AlertTriangle} variant="red" />
        <StatCard title="Verified Results" value={statsLoading ? "..." : stats?.totalCases?.toString() || "0"} icon={CheckCircle2} variant="emerald" />
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">Investigation Registry</CardTitle>
              <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Track the status of ongoing digital authenticity cases.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Filter cases..." className="pl-10 h-10 w-[200px] md:w-[300px] bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50" />
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
                <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Node ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject Title</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evidence</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Sync</TableHead>
                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {casesLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={6} className="h-16 px-8">
                      <div className="h-4 w-full bg-white/5 animate-pulse rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : casesData?.rows.length === 0 ? (
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <FolderPlus className="h-12 w-12 text-muted-foreground" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Zero investigative nodes active.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                casesData?.rows.map((c: any) => (
                  <CaseRow 
                    key={c.id}
                    id={`FS-${new Date(c.createdAt).getFullYear()}-${c.id.toString().padStart(3, '0')}`} 
                    subject={c.title} 
                    evidenceCount={c.evidenceCount || 0} 
                    status={c.status} 
                    updated={new Date(c.updatedAt).toLocaleDateString()} 
                    onClick={() => navigate(`/cases/${c.id}`)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, variant }: { title: string, value: string, icon: any, variant: 'blue' | 'red' | 'emerald' }) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  };
  
  return (
    <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl group hover:border-primary/20 transition-all duration-500">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
            <p className="text-3xl font-bold font-rajdhani text-white">{value}</p>
          </div>
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border ${colors[variant]} group-hover:scale-110 transition-transform duration-500`}>
            <Icon className="h-7 w-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CaseRow({ id, subject, evidenceCount, status, updated, onClick }: { id: string, subject: string, evidenceCount: number, status: "open" | "closed", updated: string, onClick: () => void }) {
  return (
    <TableRow className="border-white/5 group cursor-pointer hover:bg-white/5 transition-all" onClick={onClick}>
      <TableCell className="px-8 font-mono text-[10px] font-bold text-primary tracking-tighter">{id}</TableCell>
      <TableCell className="font-bold text-[10px] uppercase tracking-widest text-white group-hover:text-primary transition-colors">{subject}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Zap className="h-3 w-3 text-primary" />
          {evidenceCount} Nodes
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-white/10 ${status === 'open' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'text-muted-foreground'}`}>
          {status}
        </Badge>
      </TableCell>
      <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{updated}</TableCell>
      <TableCell className="text-right px-8">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10">
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
