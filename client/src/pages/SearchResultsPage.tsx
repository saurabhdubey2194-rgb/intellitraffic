import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSearch, Shield, ArrowRight, ShieldCheck, Activity, Search, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchResultsPage() {
  const searchParams = new URLSearchParams(useSearch());
  const query = searchParams.get("q") || "";
  const [, navigate] = useLocation();

  const { data: results, isLoading } = trpc.analysis.search.useQuery(
    { q: query },
    { enabled: query.length > 0 }
  );

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-rajdhani text-3xl font-bold tracking-tight uppercase text-white">
          Search <span className="text-primary">Results</span>
        </h1>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">
          Forensic match for node: <span className="text-primary">"{query}"</span>
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : !results || (results.analyses.length === 0 && results.features.length === 0 && results.cases.length === 0) ? (
        <Card className="border-white/5 bg-card/20 backdrop-blur-sm rounded-3xl p-20 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center border border-primary/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Search className="h-10 w-10 text-primary opacity-40 relative z-10" />
            </div>
            <div className="space-y-3">
              <h3 className="font-rajdhani text-2xl font-bold uppercase text-white">No neural matches found</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">The search query returned zero forensic matches across all operational modules.</p>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="font-rajdhani font-bold uppercase tracking-[0.2em] px-10 h-12 rounded-xl shadow-lg shadow-primary/20">
              Return to Console
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Feature Matches */}
          {results.features.length > 0 && (
            <div className="space-y-6 col-span-full">
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Neural Modules</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.features.map(feature => (
                  <Card 
                    key={feature.id} 
                    className="border-white/5 bg-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all cursor-pointer group rounded-2xl"
                    onClick={() => navigate(feature.path)}
                  >
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-primary transition-colors">{feature.title}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Case Matches */}
          {results.cases && results.cases.length > 0 && (
            <div className="space-y-6 col-span-full mt-8">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-4">Investigative Cases</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.cases.map(caseItem => (
                  <Card 
                    key={caseItem.id} 
                    className="border-white/5 bg-card/20 hover:bg-white/5 transition-all cursor-pointer group rounded-2xl"
                    onClick={() => navigate(caseItem.path)}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center border bg-primary/10 border-primary/20 text-primary">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate group-hover:text-primary transition-colors uppercase tracking-[0.1em] text-white">
                            {caseItem.title}
                          </p>
                          <Badge variant="outline" className="text-[8px] font-black uppercase mt-2 h-5 border-white/10 text-muted-foreground tracking-widest px-2">
                            Forensic Record
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Matches */}
          {results.analyses.length > 0 && (
            <div className="space-y-6 col-span-full mt-8">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-4">Forensic History</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.analyses.map(analysis => (
                  <Card 
                    key={analysis.id} 
                    className="border-white/5 bg-card/20 hover:bg-white/5 transition-all cursor-pointer group rounded-2xl"
                    onClick={() => navigate(analysis.path)}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${
                          analysis.type === 'video' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                          analysis.type === 'audio' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                          'bg-primary/10 border-primary/20 text-primary'
                        }`}>
                          {analysis.type === 'video' ? <Shield className="h-6 w-6" /> :
                           analysis.type === 'audio' ? <Activity className="h-6 w-6" /> :
                           <FileSearch className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate group-hover:text-primary transition-colors uppercase tracking-[0.1em] text-white">
                            {analysis.title}
                          </p>
                          <Badge variant="outline" className="text-[8px] font-black uppercase mt-2 h-5 border-white/10 text-muted-foreground tracking-widest px-2">
                            {analysis.type}
                          </Badge>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
