import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileSearch, History, Upload, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysisEvents } from "@/hooks/useAnalysisEvents";
import { useEffect } from "react";
	
export default function DashboardPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: jobs, isLoading } = trpc.analysis.list.useQuery({ limit: 5 });
  const { data: stats, isLoading: statsLoading } = trpc.analysis.stats.useQuery();
  const lastEvent = useAnalysisEvents();

  useEffect(() => {
    if (lastEvent) {
      utils.analysis.list.invalidate();
      utils.analysis.stats.invalidate();
    }
  }, [lastEvent, utils]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Monitor your digital authenticity analysis and active cases.</p>
        </div>
        <Button onClick={() => navigate("/analyze")} className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20">
          <Plus className="mr-2 h-4 w-4" />
          New Analysis
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Analyses" 
          value={statsLoading ? "..." : stats?.totalAnalyses?.toString() || "0"} 
          description="Lifetime scans" 
          icon={Activity} 
        />
        <StatCard 
          title="Detected Risks" 
          value={statsLoading ? "..." : stats?.detectedRisks?.toString() || "0"} 
          description="High confidence alerts" 
          icon={AlertTriangle} 
          trend={stats?.detectedRisks && stats.detectedRisks > 0 ? "up" : "down"}
        />
        <StatCard 
          title="Authenticity Rate" 
          value={statsLoading ? "..." : `${stats?.authenticityRate || 100}%`} 
          description="Average media score" 
          icon={Shield} 
        />
        <StatCard 
          title="Active Cases" 
          value={statsLoading ? "..." : stats?.activeCases?.toString() || "0"} 
          description="Pending investigation" 
          icon={FileSearch} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Recent Analysis List */}
        <Card className="md:col-span-4 border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Analysis</CardTitle>
              <CardDescription>Your latest media authenticity checks.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs?.rows.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No analysis yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload media to start detecting deepfakes.</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/analyze")}>
                  Start First Analysis
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {jobs?.rows.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        job.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {job.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : 
                         job.status === 'failed' ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5 animate-pulse" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{job.media?.originalName || 'Unnamed Media'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(job.createdAt).toLocaleDateString()} • {job.status}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/analysis/${job.id}`)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Tips */}
        <div className="md:col-span-3 space-y-6">
          <Card className="bg-blue-600 text-white border-none shadow-xl shadow-blue-600/20">
            <CardHeader>
              <CardTitle className="text-xl">Protect Your Identity</CardTitle>
              <CardDescription className="text-blue-100">
                Regularly scan your social media profiles for unauthorized deepfakes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full text-blue-600 font-semibold" onClick={() => navigate("/analyze")}>
                Setup Profile Monitoring
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HealthItem label="AI Detection Core" status="Operational" />
              <HealthItem label="Media Pipeline" status="Operational" />
              <HealthItem label="Storage Encryption" status="Operational" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, trend = "up" }: { title: string, value: string, description: string, icon: any, trend?: "up" | "down" }) {
  return (
    <Card className="border-border/40 shadow-sm overflow-hidden relative">
      <div className="absolute right-0 top-0 p-4 opacity-[0.03]">
        <Icon className="h-16 w-16" />
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${trend === 'up' ? 'text-blue-500' : 'text-amber-500'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function HealthItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-xs font-medium">{status}</span>
      </div>
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
