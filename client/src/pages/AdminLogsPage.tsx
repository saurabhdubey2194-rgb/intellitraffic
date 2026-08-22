import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Terminal, Shield, Lock, User, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function AdminLogsPage() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Comprehensive record of all platform actions and security events.</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle>System Audit Trail</CardTitle>
                <CardDescription>Security-hardened logging of all administrative and analysis actions.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filter logs..." className="pl-9 w-[200px] md:w-[300px] bg-white/5 border-border/40" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-12 animate-pulse bg-white/5" />
                  </TableRow>
                ))
              ) : (
                stats?.recentAlerts.map((log: any) => (
                  <TableRow key={log.id} className="border-border/20 group hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.action.includes('LOGIN') ? <Lock className="h-3 w-3 text-blue-500" /> : 
                         log.action.includes('DELETE') ? <Shield className="h-3 w-3 text-red-500" /> :
                         <Info className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-xs font-mono">{log.id.toString().padStart(6, '0')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">User #{log.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono bg-white/5 border-border/40">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {log.resource}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.ipAddress || "127.0.0.1"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
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
