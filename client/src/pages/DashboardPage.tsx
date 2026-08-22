import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileSearch, History, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Plus, Zap, ShieldCheck, ArrowRight, Activity, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysisEvents } from "@/hooks/useAnalysisEvents";
import { useEffect } from "react";
import { toast } from "sonner";
	
export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: jobs, isLoading: jobsLoading } = trpc.analysis.list.useQuery({ limit: 5 });
  const { data: stats, isLoading: statsLoading } = trpc.analysis.stats.useQuery();
  const lastEvent = useAnalysisEvents();

  useEffect(() => {
    if (lastEvent) {
      utils.analysis.list.invalidate();
      utils.analysis.stats.invalidate();
    }
  }, [lastEvent, utils]);

  const { data: samples } = trpc.demo.samples.useQuery();

  const handleDemoClick = (sample: any) => {
    toast.info(`Launching forensic analysis for ${sample.title}...`);
    setTimeout(() => {
      navigate("/analyze");
    }, 1500);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero / Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-card/50 border border-white/5 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield className="h-48 w-48 text-primary" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-rajdhani text-4xl md:text-5xl font-bold tracking-tight mb-4">
            COMMAND <span className="text-primary">CENTER</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8">
            Welcome back, <span className="text-white">{user?.name}</span>. Your neural forensic suite is operational. 
            Monitor threats, manage cases, and protect your digital integrity from one unified console.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => navigate("/analyze")} className="font-rajdhani font-bold uppercase tracking-widest px-8 shadow-xl shadow-primary/20">
              <Shield className="h-4 w-4 mr-2" />
              Start New Analysis
            </Button>
            <Button variant="outline" onClick={() => navigate("/threat-intelligence")} className="font-rajdhani font-bold uppercase tracking-widest px-8 border-white/10">
              View Threat Trends
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview - Amazon-style Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Forensic Scans"
          value={stats?.totalAnalyses ?? 0}
          icon={Activity}
          loading={statsLoading}
          trend="+12.4% Neural Coverage"
        />
        <StatCard
          title="Manipulation Detected"
          value={stats?.detectedRisks ?? 0}
          icon={AlertTriangle}
          variant="destructive"
          loading={statsLoading}
          trend="2 Critical Anomalies"
        />
        <StatCard
          title="Authenticity Baseline"
          value={`${stats?.authenticityRate ?? 100}%`}
          icon={ShieldCheck}
          loading={statsLoading}
          trend="System Integrity Stable"
        />
        <StatCard
          title="Usage Quota"
          value={`${stats?.usage?.used ?? 0}/${stats?.usage?.limit ?? 5}`}
          icon={History}
          loading={statsLoading}
          trend="Reset in 12 days"
          progress={(stats?.usage?.used ?? 0) / (stats?.usage?.limit ?? 5) * 100}
        />
      </div>

      {/* Feature Cards Grid - Amazon-style Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Category Card 1 */}
        <CategoryCard 
          title="Media Forensics"
          description="Analyze video, audio, and images for deepfake signatures."
          items={[
            { label: "Video Deepfake", path: "/analyze?type=video" },
            { label: "Voice Clone", path: "/analyze?type=audio" },
            { label: "Image Artifacts", path: "/analyze?type=image" },
          ]}
          image="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop"
        />

        {/* Category Card 2 */}
        <CategoryCard 
          title="Digital Safety"
          description="Scan links and messages for phishing and scams."
          items={[
            { label: "SMS Scam Check", path: "/analyze?type=text" },
            { label: "Phishing Scanner", path: "/analyze?type=url" },
            { label: "Email Verification", path: "/settings" },
          ]}
          image="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop"
        />

        {/* Category Card 3 - Demo / Samples */}
        <div className="bg-card/40 backdrop-blur-sm rounded-2xl border border-white/5 p-6 flex flex-col h-full group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-rajdhani text-xl font-bold tracking-tight uppercase">Demo Samples</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">Training Data</span>
          </div>
          <div className="space-y-4 flex-1">
            {samples?.slice(0, 3).map((sample: any) => (
              <button 
                key={sample.id}
                onClick={() => handleDemoClick(sample)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all text-left group/item"
              >
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {sample.url ? (
                    <img src={sample.url} alt={sample.title} className="h-full w-full object-cover grayscale group-hover/item:grayscale-0 transition-all" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Shield className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate group-hover/item:text-primary transition-colors uppercase tracking-wider">{sample.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-medium">{sample.verdict === 'safe' ? 'Verified Authentic' : 'Manipulation Detected'}</p>
                </div>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover/item:text-primary transition-all group-hover/item:translate-x-1" />
              </button>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-6 text-[10px] font-bold uppercase tracking-[0.2em] border-t border-white/5 pt-6 rounded-none h-auto hover:bg-transparent hover:text-primary" onClick={() => navigate("/features")}>
            View All Capabilities
          </Button>
        </div>
      </div>

      {/* Activity Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-rajdhani text-2xl font-bold tracking-tight uppercase">Forensic Activity</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="text-[10px] font-bold uppercase tracking-widest">
            Audit Full History
          </Button>
        </div>
        
        <Card className="border-white/5 bg-card/20 backdrop-blur-sm overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            {jobsLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : jobs?.rows.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                  <FileSearch className="h-8 w-8 text-primary opacity-40" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-rajdhani text-xl font-bold uppercase">No scans detected</h3>
                  <p className="text-xs text-muted-foreground font-medium">Your forensic history is empty. Upload media to start your first analysis.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/analyze")} className="font-rajdhani font-bold uppercase tracking-widest px-8 border-white/10">
                  Initialize Scan
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {jobs?.rows.map((row: any) => (
                  <div 
                    key={row.job.id} 
                    className="p-6 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group"
                    onClick={() => navigate(`/analysis/${row.job.id}`)}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${
                        row.media.type === 'video' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                        row.media.type === 'audio' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        'bg-primary/10 border-primary/20 text-primary'
                      }`}>
                        {row.media.type === 'video' ? <Shield className="h-6 w-6" /> :
                         row.media.type === 'audio' ? <Activity className="h-6 w-6" /> :
                         <FileSearch className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate max-w-[200px] md:max-w-md group-hover:text-primary transition-colors uppercase tracking-wide">
                          {row.media.originalName}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                            {row.media.type}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground/40">•</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {new Date(row.job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {row.result && (
                        <div className={`text-[10px] font-bold px-3 py-1 rounded uppercase tracking-[0.2em] border ${
                          row.result.riskLevel === 'low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                          row.result.riskLevel === 'moderate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                          'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                          {row.result.riskLevel}
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CategoryCard({ title, description, items, image }: { title: string, description: string, items: { label: string, path: string }[], image: string }) {
  const [, navigate] = useLocation();
  return (
    <div className="bg-card/40 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden flex flex-col group">
      <div className="h-40 w-full relative overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
        <div className="absolute bottom-4 left-6">
          <h3 className="font-rajdhani text-2xl font-bold tracking-tight uppercase">{title}</h3>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-6">{description}</p>
        <div className="space-y-3 mt-auto">
          {items.map((item, i) => (
            <button 
              key={i} 
              onClick={() => navigate(item.path)}
              className="w-full text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center justify-between group/item"
            >
              {item.label}
              <ChevronRight className="h-3 w-3 opacity-0 group-hover/item:opacity-100 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  loading = false,
  trend,
  progress,
}: {
  title: string;
  value: string | number;
  icon: any;
  variant?: "default" | "destructive";
  loading?: boolean;
  trend?: string;
  progress?: number;
}) {
  return (
    <Card className="border-white/5 bg-card/30 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all duration-500 rounded-2xl text-card-foreground">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
            variant === 'destructive' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-primary/10 border-primary/20 text-primary'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              variant === 'destructive' ? 'text-red-400' : 'text-primary/70'
            }`}>
              {trend}
            </span>
          )}
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
            <div className="h-3 w-32 bg-white/5 animate-pulse rounded" />
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-2xl font-bold font-rajdhani tracking-tight">{value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          </div>
        )}

        {progress !== undefined && (
          <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${progress > 80 ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}


