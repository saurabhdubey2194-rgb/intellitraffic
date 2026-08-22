import { Button } from "@/components/ui/button";
import { Shield, ShieldCheck, FileSearch, Lock, Activity, ArrowRight, ChevronRight, Zap, CreditCard, HelpCircle, Globe } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Home() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleAction = (label: string) => {
    toast.info(`Initializing ${label} request...`, {
      description: "Our neural gateway is processing your request."
    });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans">
      {/* Background Stars Effect */}
      <div className="stars-container fixed inset-0 z-0 pointer-events-none opacity-30" />
      
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 blur-lg bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Shield className="h-5 w-5 text-primary relative z-10" />
            </div>
            <span className="font-rajdhani text-2xl font-bold tracking-tighter uppercase">
              Fake<span className="text-primary">Shield</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <button onClick={() => navigate("/features")} className="hover:text-primary transition-colors cursor-pointer uppercase tracking-[0.2em]">Capabilities</button>
            <button onClick={() => navigate("/pricing")} className="hover:text-primary transition-colors cursor-pointer uppercase tracking-[0.2em]">Pricing</button>
            <button onClick={() => navigate("/threat-intelligence")} className="hover:text-primary transition-colors cursor-pointer uppercase tracking-[0.2em]">Intelligence</button>
            <button onClick={() => navigate("/faq")} className="hover:text-primary transition-colors cursor-pointer uppercase tracking-[0.2em]">Support</button>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Button onClick={() => navigate("/dashboard")} className="h-10 px-6 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
                Workspace Console
              </Button>
            ) : (
              <>
                <Button onClick={() => navigate("/signin")} variant="ghost" className="text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl px-6">Sign In</Button>
                <Button onClick={() => navigate("/signup")} className="h-10 px-6 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-32 md:py-48 overflow-hidden z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.1),transparent_70%)]" />
        
        <div className="container relative px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-10 animate-pulse">
            <ShieldCheck className="h-3.5 w-3.5" />
            Digital Authenticity Engine v4.0
          </div>
          
          <h1 className="font-rajdhani text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-10 max-w-5xl mx-auto leading-[0.85] text-white">
            EXPOSE THE <span className="text-primary italic">UNSEEN</span><br />
            PROTECT THE <span className="text-white/90">TRUTH</span>
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground mb-16 max-w-2xl mx-auto leading-relaxed font-bold uppercase tracking-widest opacity-80">
            FakeShield AI utilizes neural forensic analysis to detect deepfakes, 
            voice clones, and digital manipulation with 99.8% precision.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" onClick={() => navigate("/signup")} className="h-16 px-12 text-xs font-bold uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-black w-full sm:w-auto shadow-2xl shadow-primary/30 rounded-2xl">
              Launch Analysis Console
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/threat-intelligence")} className="h-16 px-12 text-xs font-bold uppercase tracking-[0.2em] w-full sm:w-auto border-white/10 hover:bg-white/5 rounded-2xl text-white">
              View Threat Reports
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-32 relative z-10 bg-white/[0.02] backdrop-blur-sm border-y border-white/5">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-xl space-y-4">
              <h2 className="font-rajdhani text-4xl md:text-6xl font-bold tracking-tight text-white uppercase leading-none">MILITARY-GRADE<br /><span className="text-primary">FORENSIC SUITE</span></h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Protecting individuals and enterprises from the next generation of digital deception.</p>
            </div>
            <Button onClick={() => navigate("/features")} variant="ghost" className="text-primary font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-primary/10 hover:text-primary rounded-xl px-6 h-12">Explore All Capabilities <ChevronRight className="h-3 w-3 ml-2" /></Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={FileSearch} 
              title="Video Deepfake Detection" 
              description="Frame-by-frame neural analysis to identify GAN artifacts and temporal inconsistencies."
              badge="High Precision"
              onClick={() => navigate("/analyze?type=video")}
            />
            <FeatureCard 
              icon={Activity} 
              title="Voice Clone Analysis" 
              description="Spectrogram auditing to detect AI-synthesized speech and voice swapping patterns."
              badge="Real-time"
              onClick={() => navigate("/analyze?type=audio")}
            />
            <FeatureCard 
              icon={Lock} 
              title="Encrypted Workspaces" 
              description="Secure forensic environments for investigators with automated case documentation."
              badge="Secure"
              onClick={() => navigate("/history")}
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-40 relative z-10">
        <div className="container px-4 text-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 mb-20">Trusted by leading security organizations</h3>
          <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 opacity-20 grayscale contrast-150">
             <div className="font-rajdhani text-3xl font-bold italic tracking-tighter text-white">SECURE.IO</div>
             <div className="font-rajdhani text-3xl font-bold italic tracking-tighter text-white">DEFENSE-X</div>
             <div className="font-rajdhani text-3xl font-bold italic tracking-tighter text-white">GLOBAL-WATCH</div>
             <div className="font-rajdhani text-3xl font-bold italic tracking-tighter text-white">VERIFY.NET</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-24 bg-black relative z-10">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <span className="font-rajdhani text-3xl font-bold tracking-tighter uppercase text-white">FakeShield</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest opacity-70">
                The global standard for digital media verification and threat intelligence. 
                Built for a world where seeing is no longer believing.
              </p>
            </div>
            
            <div>
              <h4 className="font-rajdhani font-bold text-xs uppercase tracking-[0.2em] mb-8 text-white">Forensic Suite</h4>
              <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <li><a onClick={() => navigate("/analyze?type=video")} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><Zap className="h-3 w-3" /> Video Forensics</a></li>
                <li><a onClick={() => navigate("/analyze?type=audio")} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><Zap className="h-3 w-3" /> Audio Auditing</a></li>
                <li><a onClick={() => navigate("/analyze?type=text")} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><Zap className="h-3 w-3" /> Scam Detection</a></li>
                <li><a onClick={() => navigate("/analyze?type=url")} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><Zap className="h-3 w-3" /> URL Analysis</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-rajdhani font-bold text-xs uppercase tracking-[0.2em] mb-8 text-white">Operational Hub</h4>
              <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <li><a onClick={() => navigate("/threat-intelligence")} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><Globe className="h-3 w-3" /> Threat Intel</a></li>
                <li><a onClick={() => navigate("/faq")} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><HelpCircle className="h-3 w-3" /> Help Center</a></li>
                <li><a onClick={() => navigate("/pricing")} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><CreditCard className="h-3 w-3" /> Pricing Plans</a></li>
                <li><a onClick={() => handleAction("API Documentation")} className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><FileSearch className="h-3 w-3" /> API Protocol</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-rajdhani font-bold text-xs uppercase tracking-[0.2em] mb-8 text-white">Neural Connect</h4>
              <div className="flex gap-4 mb-8">
                <div onClick={() => handleAction("X.COM")} className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all cursor-pointer group">
                  <Activity className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <div onClick={() => handleAction("GitHub")} className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-all cursor-pointer group">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </div>
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Neural Grid Operational
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">
              © 2026 FAKESHIELD AI NEURAL FORENSIC PLATFORM. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-10 text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">
              <a onClick={() => handleAction("Privacy")} className="hover:text-primary transition-colors cursor-pointer">Privacy Protocol</a>
              <a onClick={() => handleAction("Terms")} className="hover:text-primary transition-colors cursor-pointer">Service Terms</a>
              <a onClick={() => handleAction("Security")} className="hover:text-primary transition-colors cursor-pointer">Neural Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, badge, onClick }: { icon: any, title: string, description: string, badge?: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="p-10 rounded-3xl border border-white/5 bg-white/[0.02] hover:border-primary/30 transition-all duration-500 group relative overflow-hidden cursor-pointer"
    >
      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
      </div>
      
      <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-10 group-hover:bg-primary/20 transition-all duration-500">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      
      {badge && (
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/70 mb-3 block">{badge}</span>
      )}
      
      <h3 className="font-rajdhani text-2xl font-bold mb-5 group-hover:text-primary transition-colors text-white uppercase tracking-tight">{title}</h3>
      <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest mb-8 opacity-80">{description}</p>
      
      <div className="flex items-center text-[9px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-primary transition-all duration-500">
        Access Neural Module <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-2 transition-transform" />
      </div>
    </div>
  );
}
