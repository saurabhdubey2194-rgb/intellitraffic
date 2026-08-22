import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Mic, MessageSquare, Link as LinkIcon, FileText, Shield, Zap, Lock, Globe, Search, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function FeaturesPage() {
  const [, navigate] = useLocation();
  const features = [
    { 
      title: "Deepfake Video Engine", 
      desc: "Multi-layered neural analysis detecting facial inconsistencies, lighting artifacts, and temporal jitters.", 
      icon: <Video className="h-6 w-6 text-orange-500" />, 
      colorClass: "bg-orange-500/10 border-orange-500/20 text-orange-500",
      badgeClass: "border-orange-500/30 text-orange-500 bg-orange-500/5",
      stats: "99.8% Precision",
      path: "/analyze?type=video"
    },
    { 
      title: "Neural Audio Forensic", 
      desc: "Spectral fingerprinting and AI voice probability analysis detecting synthetic speech and splicing.", 
      icon: <Mic className="h-6 w-6 text-purple-500" />, 
      colorClass: "bg-purple-500/10 border-purple-500/20 text-purple-500",
      badgeClass: "border-purple-500/30 text-purple-500 bg-purple-500/5",
      stats: "98.2% Accuracy",
      path: "/analyze?type=audio"
    },
    { 
      title: "Scam Language Model", 
      desc: "Advanced NLP detection for phishing, financial fraud, and social engineering in text communications.", 
      icon: <MessageSquare className="h-6 w-6 text-cyan-500" />, 
      colorClass: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500",
      badgeClass: "border-cyan-500/30 text-cyan-500 bg-cyan-500/5",
      stats: "Real-time Processing",
      path: "/analyze?type=text"
    },
    { 
      title: "Phishing URL Scanner", 
      desc: "Deep inspection of domain reputation, redirect chains, and obfuscated malicious payloads.", 
      icon: <LinkIcon className="h-6 w-6 text-emerald-500" />, 
      colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
      badgeClass: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5",
      stats: "10-Indicator Scan",
      path: "/analyze?type=url"
    },
    { 
      title: "Document Authenticity", 
      desc: "Verification of digital signatures, metadata integrity, and visual manipulation in PDF evidence.", 
      icon: <FileText className="h-6 w-6 text-pink-500" />, 
      colorClass: "bg-pink-500/10 border-pink-500/20 text-pink-500",
      badgeClass: "border-pink-500/30 text-pink-500 bg-pink-500/5",
      stats: "Forensic Grade",
      path: "/analyze?type=document"
    },
    { 
      title: "Digital Safety Hub", 
      desc: "Centralized case management, real-time alerts, and comprehensive forensic scan history.", 
      icon: <Shield className="h-6 w-6 text-yellow-500" />, 
      colorClass: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
      badgeClass: "border-yellow-500/30 text-yellow-500 bg-yellow-500/5",
      stats: "Unified Workspace",
      path: "/history"
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
          <Zap className="h-3 w-3" />
          Technological Capabilities
        </div>
        <h1 className="text-5xl font-bold font-rajdhani tracking-tight uppercase text-white">Neural <span className="text-primary">Forensic</span> Suite</h1>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-xl mx-auto">Exposing digital deception through multi-modal neural analysis and forensic verification.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <Card 
            key={i} 
            className="group relative bg-card/30 backdrop-blur-sm border-white/5 rounded-3xl overflow-hidden transition-all duration-500 hover:border-primary/30 hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate(f.path)}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="p-8 space-y-6">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform duration-500 ${f.colorClass}`}>
                {f.icon}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 ${f.badgeClass}`}>
                    {f.stats}
                  </Badge>
                </div>
                <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">{f.title}</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="px-8 pb-8 space-y-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed min-h-[40px]">
                {f.desc}
              </p>
              
              <div className="pt-4 flex items-center gap-2 text-[8px] font-black text-primary uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                Explore Capability <ArrowRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-16 border-t border-white/5">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold font-rajdhani uppercase tracking-tight text-white">The Forensic <span className="text-primary">Standard</span></h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-loose">FakeShield AI utilizes an ensemble of neural networks trained on millions of authentic and manipulated media samples. Our engine detects subtle artifacts that are invisible to the human eye, providing a forensic-grade verdict with explainable evidence.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-2xl font-bold font-rajdhani text-primary tracking-tighter">99.8%</div>
              <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Detection Accuracy</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold font-rajdhani text-primary tracking-tighter">&lt; 15s</div>
              <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Average Scan Time</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
          <div className="relative space-y-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-rajdhani uppercase tracking-tight text-white">Enterprise Infrastructure</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">Scale your forensic operations with our dedicated API, bulk processing pipelines, and collaborative investigator workspaces.</p>
            <button 
              onClick={() => navigate("/pricing")}
              className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
            >
              Request Deployment Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
