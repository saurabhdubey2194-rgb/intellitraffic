import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Shield, Zap, Globe, Star, ZapOff } from "lucide-react";
import { toast } from "sonner";

export default function PricingPage() {
  const plans = [
    {
      name: "Sentinel Free",
      price: "$0",
      description: "Basic forensic verification for individual users.",
      features: ["5 Neural Analyses / Mo", "Standard PDF Reports", "7-Day Forensic History", "Community Support Access"],
      cta: "Current Protocol",
      current: true,
      icon: <ZapOff className="h-6 w-6 text-muted-foreground" />
    },
    {
      name: "Guardian Pro",
      price: "$29",
      description: "Advanced protection for professional investigators.",
      features: ["Unlimited Neural Scans", "Advanced Forensic Reports", "Persistent Case Archive", "Priority Compute Queue", "Basic API Integration"],
      cta: "Upgrade Protocol",
      current: false,
      popular: true,
      icon: <Zap className="h-6 w-6 text-primary" />
    },
    {
      name: "Fortress Enterprise",
      price: "Custom",
      description: "Scalable forensic infrastructure for organizations.",
      features: ["Bulk Media Processing", "Dedicated Neural Clusters", "Collaborative Workspaces", "24/7 Forensic Consultant", "Full API / Webhook Access"],
      cta: "Contact Command",
      current: false,
      icon: <Shield className="h-6 w-6 text-primary" />
    }
  ];

  const handleAction = (planName: string) => {
    if (planName === "Sentinel Free") return;
    toast.info(`Initializing ${planName} deployment request...`, {
      description: "Our security team will contact your identity node for verification."
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
          <Star className="h-3 w-3" />
          Subscription Tiers
        </div>
        <h1 className="text-5xl font-bold font-rajdhani tracking-tight uppercase text-white">Neural <span className="text-primary">Protection</span> Plans</h1>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-xl mx-auto">Select the forensic operational capacity that aligns with your security requirements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p, i) => (
          <Card key={i} className={`relative flex flex-col border-white/5 bg-card/30 backdrop-blur-sm rounded-3xl overflow-hidden transition-all duration-500 hover:border-primary/30 group ${p.popular ? 'ring-1 ring-primary/50' : ''}`}>
            {p.popular && (
              <div className="absolute top-0 right-0 z-20">
                <div className="bg-primary text-black text-[8px] font-black px-6 py-1 uppercase tracking-widest transform rotate-45 translate-x-6 translate-y-2 shadow-xl">
                  Most Popular
                </div>
              </div>
            )}
            
            <CardHeader className="p-8 space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
                {p.icon}
              </div>
              <div className="space-y-1">
                <CardTitle className="font-rajdhani text-2xl uppercase tracking-tight text-white">{p.name}</CardTitle>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">{p.description}</p>
              </div>
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-5xl font-bold font-rajdhani tracking-tighter">{p.price}</span>
                {p.price !== "Custom" && <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">/ Mo</span>}
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 px-8 pb-8">
              <div className="h-px w-full bg-white/5 mb-8" />
              <ul className="space-y-4">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="p-8 pt-0">
              <Button 
                onClick={() => handleAction(p.name)}
                className={`w-full h-14 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                  p.current 
                    ? 'bg-white/5 border border-white/10 text-muted-foreground cursor-default' 
                    : 'bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20'
                }`} 
                disabled={p.current}
              >
                {p.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-3xl bg-white/5 border border-white/10 items-center">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-rajdhani uppercase tracking-tight text-white">Enterprise Infrastructure</h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">Need a custom deployment or high-volume processing? Our engineering team can provision dedicated neural clusters tailored to your operational scale.</p>
        </div>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => handleAction("Enterprise Global")}
            className="h-14 px-8 rounded-2xl border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white"
          >
            <Globe className="mr-2 h-4 w-4 text-primary" />
            Global Network Inquiry
          </Button>
        </div>
      </div>
    </div>
  );
}
