import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Activity, AlertTriangle, Cpu, HardDrive, Database, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  // In a real app, this would fetch system-wide stats
  const { data: usersList } = trpc.auth.profile.useQuery(); // Placeholder

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Command Center</h1>
        <p className="text-muted-foreground">System-wide monitoring, analytics, and infrastructure health.</p>
      </div>

      {/* Infrastructure Health */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HealthCard title="CPU Load" value="12%" icon={Cpu} status="normal" />
        <HealthCard title="Memory Usage" value="4.2 GB" icon={HardDrive} status="normal" />
        <HealthCard title="Active Connections" value="1,284" icon={Globe} status="normal" />
        <HealthCard title="Database Latency" value="8ms" icon={Database} status="normal" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Activity */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>Live processing throughput and error rates.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-border/20">
            <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-20">
              <Activity className="h-16 w-16" />
              <p className="text-sm font-medium">Throughput Visualization</p>
            </div>
          </CardContent>
        </Card>

        {/* User Management Overview */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle>User Overview</CardTitle>
            <CardDescription>Recent registrations and verification status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-border/20">
                  <TableCell className="font-medium text-sm">System Administrator</TableCell>
                  <TableCell><Badge variant="outline">Admin</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Verified</div></TableCell>
                </TableRow>
                <TableRow className="border-border/20">
                  <TableCell className="font-medium text-sm">John Investigator</TableCell>
                  <TableCell><Badge variant="outline">Investigator</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Verified</div></TableCell>
                </TableRow>
                <TableRow className="border-border/20">
                  <TableCell className="font-medium text-sm">Sarah Miller</TableCell>
                  <TableCell><Badge variant="outline">User</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" />Pending</div></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HealthCard({ title, value, icon: Icon, status }: { title: string, value: string, icon: any, status: "normal" | "warning" | "critical" }) {
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`h-1.5 w-1.5 rounded-full ${status === 'normal' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-[10px] font-medium uppercase text-muted-foreground">{status}</span>
        </div>
      </CardContent>
    </Card>
  );
}
