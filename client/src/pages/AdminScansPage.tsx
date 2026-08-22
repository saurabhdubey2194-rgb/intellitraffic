import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, ExternalLink, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Link } from "wouter";

export default function AdminScansPage() {
  const { data: scans, isLoading } = trpc.analysis.list.useQuery({ limit: 50 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan Monitoring</h1>
        <p className="text-muted-foreground">Monitor all platform analysis activity and high-risk detections.</p>
      </div>

      <Card className="border-border/40 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Global Scan Activity</CardTitle>
              <CardDescription>Real-time overview of all media processed by FakeShield AI.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search scans..." className="pl-9 w-[200px] md:w-[300px] bg-white/5 border-border/40" />
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
                <TableHead>Scan ID</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="h-12 animate-pulse bg-white/5" />
                  </TableRow>
                ))
              ) : (
                scans?.rows.map((scan: any) => (
                  <TableRow key={scan.id} className="border-border/20 group hover:bg-white/5">
                    <TableCell className="font-mono text-xs text-blue-500">
                      SCAN-{scan.id.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium text-sm">
                      {scan.media?.originalName || "Unnamed Media"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize bg-white/5 border-border/40">
                        {scan.media?.type || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${scan.result?.riskLevel === 'critical' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 
                          scan.result?.riskLevel === 'high' ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : 
                          scan.result?.riskLevel === 'medium' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' : 
                          'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'}
                      `}>
                        {scan.result?.riskLevel?.toUpperCase() || "PENDING"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        {scan.status === 'completed' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : scan.status === 'failed' ? (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        <span className="capitalize">{scan.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(scan.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/analysis/${scan.id}`}>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
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
