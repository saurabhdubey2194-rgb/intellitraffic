import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Terminal, Shield, Lock, User, Info, ShieldAlert, Cpu } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function AdminLogsPage() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            <Terminal className="h-3 w-3" />
            Security Audit
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-rajdhani uppercase text-white">System <span className="text-primary">Logs</span></h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Comprehensive record of all platform actions and security events.</p>
        </div>
        
        <Button variant="outline" className="h-12 px-8 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white">
          <Download className="mr-2 h-4 w-4" />
          Export Audit Archive
        </Button>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-primary" />
                Forensic Audit Trail
              </CardTitle>
              <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Security-hardened logging of all administrative and analysis actions.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input placeholder="Filter neural logs..." className="pl-10 h-10 w-[200px] md:w-[300px] bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-primary/50 text-white" />
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
                <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Event Node</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operator</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Node</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Point</TableHead>
                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sync Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={6} className="h-16 px-8">
                      <div className="h-4 w-full bg-white/5 animate-pulse rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                stats?.recentAlerts.map((log: any) => (
                  <TableRow key={log.id} className="border-white/5 group hover:bg-white/5 transition-all">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                          log.action.includes('DELETE') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                          log.action.includes('LOGIN') ? 'bg-primary/10 border-primary/20 text-primary' :
                          'bg-white/5 border-white/10 text-muted-foreground'
                        }`}>
                          {log.action.includes('LOGIN') ? <Lock className="h-4 w-4" /> : 
                           log.action.includes('DELETE') ? <Shield className="h-4 w-4" /> :
                           <Info className="h-4 w-4" />}
                        </div>
                        <span className="font-mono text-[10px] font-bold text-primary tracking-tighter">
                          EVT-{log.id.toString().padStart(6, '0')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">Operator #{log.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-white/10 bg-black/50 text-primary">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-[150px] truncate">
                      {log.resourceType || "System"}
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                      {log.ipAddress || "127.0.0.1"}
                    </TableCell>
                    <TableCell className="text-right px-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
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
