import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Shield, Zap, Lock, Globe, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";

export default function FAQPage() {
  const faqs = [
    {
      q: "How accurate is FakeShield AI?",
      a: "Our neural forensic models achieve a 99.8% accuracy rate in digital manipulation detection and 98.7% in deepfake video analysis, verified against the latest GAN and diffusion artifacts.",
      icon: <Zap className="h-4 w-4 text-primary" />
    },
    {
      q: "Is my data safe during analysis?",
      a: "Yes. All uploads are processed via military-grade encrypted channels. We utilize ephemeral forensic processing, meaning your data is automatically purged after the report is generated unless you explicitly save it to a case.",
      icon: <Lock className="h-4 w-4 text-primary" />
    },
    {
      q: "What types of files can I analyze?",
      a: "FakeShield supports a multi-modal spectrum: Images (JPG, PNG, WebP), Video (MP4, MOV, AVI), Audio (MP3, WAV, AAC), Documents (PDF), and direct URLs for phishing and social engineering analysis.",
      icon: <Shield className="h-4 w-4 text-primary" />
    },
    {
      q: "How long does a deepfake analysis take?",
      a: "Our high-performance compute cluster processes most scans in under 15 seconds. Large 4K forensic video analysis may take up to 90 seconds for exhaustive frame-by-frame verification.",
      icon: <Clock className="h-4 w-4 text-primary" />
    },
    {
      q: "Can I use FakeShield for enterprise security?",
      a: "Absolutely. Our Enterprise tier provides dedicated API access, bulk processing infrastructure, team collaboration workspaces, and custom model fine-tuning for specific corporate threat profiles.",
      icon: <Globe className="h-4 w-4 text-primary" />
    }
  ];

  const handleContact = () => {
    toast.info("Connecting to forensic support console...", {
      description: "Our technical experts will be available shortly."
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
          <HelpCircle className="h-3 w-3" />
          Forensic Knowledge Base
        </div>
        <h1 className="text-5xl font-bold font-rajdhani tracking-tight uppercase text-white">Neural <span className="text-primary">Intelligence</span> FAQ</h1>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-xl mx-auto">Find technical answers to common inquiries regarding our digital authenticity engine and forensic workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-bold font-rajdhani uppercase tracking-tight text-white">Security First</h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">Encrypted forensic processing with automatic data purging protocols.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-bold font-rajdhani uppercase tracking-tight text-white">Real-time Speed</h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">High-performance neural compute delivering verdicts in seconds.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-bold font-rajdhani uppercase tracking-tight text-white">24/7 Support</h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">Dedicated forensic experts available for enterprise tier consultations.</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-white/10 bg-white/5 rounded-2xl px-6 overflow-hidden">
            <AccordionTrigger className="font-rajdhani text-left hover:text-primary transition-colors py-6 uppercase tracking-tight text-lg hover:no-underline text-white">
              <div className="flex items-center gap-4">
                {f.icon}
                {f.q}
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-loose pb-6">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 text-center space-y-6">
        <h3 className="text-2xl font-bold font-rajdhani uppercase tracking-tight text-white">Still have questions?</h3>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Our technical team is ready to assist you with custom forensic requirements.</p>
        <button 
          onClick={handleContact}
          className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-black text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
        >
          Contact Support Console
        </button>
      </div>
    </div>
  );
}
