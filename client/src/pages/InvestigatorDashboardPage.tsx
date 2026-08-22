import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSearch, FolderPlus, Shield, Clock, AlertTriangle, CheckCircle2, MoreHorizontal, Filter, Search } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function InvestigatorDashboardPage() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.cases.stats.useQuery();
  const { data: casesData, isLoading: casesLoading } = trpc.cases.list.useQuery({ limit: 10 });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investigator Workspace</h1>
          <p className="text-muted-foreground">Manage deepfake investigation cases and forensic evidence.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20">
          <FolderPlus className="mr-2 h-4 w-4" />
          Create New Case
        </Button>
      </div>

      {/* Case Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Open Cases" value={statsLoading ? "..." : stats?.openCases?.toString() || "0"} icon={Clock} color="text-blue-500" />
        <StatCard title="High Priority" value={statsLoading ? "..." : stats?.highPriority?.toString() || "0"} icon={AlertTriangle} color="text-red-500" />
        <StatCard title="Total Investigations" value={statsLoading ? "..." : stats?.totalCases?.toString() || "0"} icon={CheckCircle2} color="text-emerald-500" />
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Active Investigations</CardTitle>
              <CardDescription>Track the status of ongoing digital authenticity cases.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search cases..." className="pl-9 w-[200px] md:w-[300px]" />
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
                <TableHead>Case ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {casesLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/50 rounded-lg" />
                  </TableRow>
                ))
              ) : casesData?.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No active investigations found.
                  </TableCell>
                </TableRow>
              ) : (
                casesData?.rows.map((c: any) => (
                  <CaseRow 
                    key={c.id}
                    id={`CASE-${new Date(c.createdAt).getFullYear()}-${c.id.toString().padStart(3, '0')}`} 
                    subject={c.title} 
                    evidenceCount={0} // Evidence count requires additional join or count
                    status={c.status} 
                    updated={new Date(c.updatedAt).toLocaleDateString()} 
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

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) {
  return (
    <Card className="border-border/40 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CaseRow({ id, subject, evidenceCount, status, updated }: { id: string, subject: string, evidenceCount: number, status: "open" | "closed", updated: string }) {
  return (
    <TableRow className="border-border/20 group">
      <TableCell className="font-mono text-xs font-bold text-blue-500">{id}</TableCell>
      <TableCell className="font-medium text-sm">{subject}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileSearch className="h-3 w-3" />
          {evidenceCount} files
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={status === 'open' ? 'secondary' : 'outline'} className={status === 'open' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}>
          {status.toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{updated}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
