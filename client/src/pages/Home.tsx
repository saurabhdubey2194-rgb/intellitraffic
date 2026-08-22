import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, FileSearch, Lock, Activity, ArrowRight, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/60 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              FakeShield <span className="text-blue-600">AI</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Button onClick={() => navigate("/dashboard")} variant="default" className="bg-blue-600 hover:bg-blue-500">
                Go to Workspace
              </Button>
            ) : (
              <>
                <Button onClick={() => navigate("/signin")} variant="ghost">Sign In</Button>
                <Button onClick={() => navigate("/signup")} variant="default" className="bg-blue-600 hover:bg-blue-500">Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(37,99,235,0.1),transparent)]" />
        <div className="container relative px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <ShieldCheck className="h-3 w-3" />
            Next-Gen Deepfake Detection
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
            Trust Your Eyes Again with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">FakeShield AI</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Protect your digital identity and verify media authenticity using state-of-the-art AI analysis. Detect deepfakes, GANs, and digital manipulations in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/signup")} className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 w-full sm:w-auto shadow-xl shadow-blue-600/20">
              Start Free Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base w-full sm:w-auto">
              How it Works
            </Button>
          </div>
          
          {/* Hero Visual Placeholder */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="aspect-[16/9] rounded-2xl border border-border/60 bg-[#0b1526] shadow-2xl overflow-hidden flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <FileSearch className="h-16 w-16 opacity-20" />
                <p className="text-sm font-medium opacity-40">Analysis Pipeline Visualization</p>
              </div>
            </div>
            {/* Floating Badges */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl flex flex-col items-center justify-center text-emerald-400 shadow-xl hidden md:flex">
              <CheckCircle2 className="h-8 w-8 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
            </div>
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl flex flex-col items-center justify-center text-red-400 shadow-xl hidden md:flex">
              <AlertCircle className="h-8 w-8 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Risk</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Comprehensive Detection Suite</h2>
          <p className="text-muted-foreground">Advanced algorithms designed to stay ahead of generative AI.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={FileSearch} 
            title="Multi-Modal Analysis" 
            description="Deep analysis of images, videos, and audio streams to identify subtle inconsistencies."
          />
          <FeatureCard 
            icon={Lock} 
            title="Privacy First" 
            description="Secure, encrypted processing environment ensuring your media stays confidential."
          />
          <FeatureCard 
            icon={Activity} 
            title="Real-time Reporting" 
            description="Detailed forensic reports with confidence scores and risk heatmaps."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 py-12 bg-[#07111f]">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="text-lg font-bold tracking-tight">FakeShield AI</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 FakeShield AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-border/60 bg-card hover:border-blue-500/50 transition-all duration-300 group">
      <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon className="h-6 w-6 text-blue-400" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
      <Button variant="link" className="mt-4 p-0 h-auto text-blue-400 group-hover:translate-x-1 transition-transform">
        Learn more <ChevronRight className="ml-1 h-3 w-3" />
      </Button>
    </div>
  );
}
