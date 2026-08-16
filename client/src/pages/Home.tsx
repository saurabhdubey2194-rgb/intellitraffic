import { LogoMark } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startLogin } from "@/const";
import { HeroTrafficViz } from "@/components/HeroTrafficViz";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/_core/hooks/useAuth";
import { ROLE_LABEL } from "@/lib/ui";
import {
  Ambulance,
  ArrowRight,
  Bot,
  Eye,
  Gauge,
  HeartPulse,
  Hospital,
  Landmark,
  LineChart,
  MapPin,
  Radio,
  Siren,
  ShieldCheck,
  Shield,
  TrafficCone,
  User,
  Waves,
  Zap,
  Clock,
  Route,
  Siren as SirenAlt,
} from "lucide-react";
import { Link } from "wouter";

const NAV_ITEMS = [
  {
    icon: User,
    role: "public",
    title: "Public",
    desc: "Live traffic around you, predictive route search with multi-route comparison, and incident reporting.",
    href: "/dashboard",
  },
  {
    icon: Ambulance,
    role: "ambulance",
    title: "Ambulance",
    desc: "Request an emergency corridor, get AI-predicted routes, live signal preparation ahead of you.",
    href: "/dashboard",
  },
  {
    icon: Shield,
    role: "police",
    title: "Police",
    desc: "Verify ambulance requests, manage incidents, run what-if simulations, and monitor corridors.",
    href: "/dashboard",
  },
  {
    icon: Hospital,
    role: "hospital",
    title: "Hospital",
    desc: "Receive incoming emergencies with live ETA, confirm arrival, and coordinate ambulance intake.",
    href: "/dashboard",
  },
];

const WORKFLOW = [
  { icon: Siren, label: "Emergency Request" },
  { icon: ShieldCheck, label: "Police Verification" },
  { icon: Bot, label: "AI Route Prediction" },
  { icon: LineChart, label: "Predictive Traffic Analysis" },
  { icon: Radio, label: "Corridor Preparation" },
  { icon: TrafficCone, label: "Signal Coordination" },
  { icon: Eye, label: "Public Alerts" },
  { icon: HeartPulse, label: "Hospital Arrival" },
  { icon: Gauge, label: "Corridor Closure" },
  { icon: LineChart, label: "Analytics" },
];

/** How-It-Works chain per spec: Emergency → Verification → AI Route → Traffic Analysis → Emergency Corridor → Hospital */
const HOW_IT_WORKS = [
  { icon: SirenAlt, step: "01", title: "Emergency", desc: "An ambulance driver or public user raises an emergency request with destination hospital." },
  { icon: ShieldCheck, step: "02", title: "Verification", desc: "Police verify the ambulance registration and confirm the hospital association." },
  { icon: Bot, step: "03", title: "AI Route", desc: "The AI route engine evaluates five inputs and selects the fastest predicted path." },
  { icon: LineChart, step: "04", title: "Traffic Analysis", desc: "Predictive traffic analysis forecasts congestion along the route in real time." },
  { icon: Radio, step: "05", title: "Emergency Corridor", desc: "Signals along the path prepare a green corridor before the ambulance arrives." },
  { icon: Hospital, step: "06", title: "Hospital", desc: "The hospital receives live ETA, prepares intake, and confirms arrival on completion." },
];

/** Impact demo metrics (simulated demo values as requested by the spec). */
const IMPACT_METRICS = [
  { icon: Clock, value: "~40%", label: "Emergency Response Improvement", note: "Simulated reduction in response time with green corridors" },
  { icon: Ambulance, value: "5", label: "Active Ambulances", note: "Verified demo ambulances across Delhi NCR" },
  { icon: Route, value: "16", label: "Signals Coordinated", note: "Simulated AI signal optimization across the demo grid" },
  { icon: SirenAlt, value: "45+", label: "Activity Events Logged", note: "Persistent audit trail with ACT-DLH-2026 IDs" },
];

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0c1a33]/85 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
            <LogoMark />
            <span className="font-bold tracking-tight text-lg">
              Intelli<span className="text-emerald-400">Traffic</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="!border-white/10 !text-slate-200" />
            {loading ? null : user ? (
              <Link href="/dashboard">
                <Button variant="secondary" className="font-semibold">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => startLogin()}
                className="font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
              >
                Sign In
              </Button>
            )}
            <Link href="/signin">
              <Button variant="destructive" className="font-semibold">
                <SirenAlt className="mr-1 h-4 w-4" /> Emergency Access
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="container relative py-20 md:py-28 fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Simulated city-wide demo — Delhi NCR
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
              Don't just find traffic.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                Predict it. Clear it. Beat it.
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              AI-powered emergency traffic management that connects public users,
              ambulances, police stations, and hospitals in real time. Predictive
              emergency corridors clear the road <em>before</em> the ambulance
              reaches it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => startLogin()}
                className="font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25"
              >
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Link href="/map">
                <Button size="lg" variant="outline" className="font-bold border-white/15">
                  Explore Platform
                </Button>
              </Link>
              <Link href="/signin">
                <Button size="lg" variant="destructive" className="font-bold">
                  <SirenAlt className="mr-1 h-4 w-4" /> Emergency Access
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex justify-center">
            <HeroTrafficViz />
          </div>
          </div>
        </div>
      </section>

      {/* Workflow strip */}
      <section className="border-y border-white/5 bg-white/[0.025]">
        <div className="container py-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            End-to-End Emergency Lifecycle
          </p>
          <div className="flex flex-wrap gap-2">
            {WORKFLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-card px-3 py-1.5 text-xs font-medium text-card-foreground">
                  <step.icon className="h-3.5 w-3.5 text-emerald-400" />
                  {step.label}
                </div>
                {i < WORKFLOW.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-16 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          How It Works
        </p>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">
          From emergency call to hospital arrival
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map((step, i) => (
            <Card key={step.step} className="border-white/10 bg-card fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-400/25 flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <span className="text-xs font-bold tracking-widest text-muted-foreground">STEP {step.step}</span>
                </div>
                <h3 className="font-bold tracking-tight">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Impact */}
      <section className="border-t border-white/5 bg-white/[0.025]">
        <div className="container py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Platform Impact — Demo Metrics
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">
            Measured outcomes in the Delhi NCR demo
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {IMPACT_METRICS.map((m, i) => (
              <Card key={m.label} className="border-white/10 bg-card fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-5 space-y-2">
                  <m.icon className="h-5 w-5 text-emerald-300" />
                  <p className="text-3xl font-black tracking-tight">{m.value}</p>
                  <p className="text-sm font-semibold">{m.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section className="container py-16 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          One Platform · Five Roles
        </p>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">
          Everyone in the loop, nothing extra
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {NAV_ITEMS.map((n, i) => (
            <Card
              key={n.role}
              className="border-white/10 bg-card fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-400/25 flex items-center justify-center">
                    <n.icon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{n.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {ROLE_LABEL[n.role]}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{n.desc}</p>
                <Link href="/dashboard">
                  <Button variant="ghost" className="mt-3 -ml-3 text-sm font-semibold text-emerald-300 hover:text-emerald-200">
                    Open {n.title} console <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 bg-white/[0.025]">
        <div className="container py-16 md:py-20 grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-black tracking-tight mb-6">
              Built for Indian smart cities
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              From Delhi NCR to India-wide: scalable location architecture supporting
              states, districts, cities, areas, roads, and intersections. Report
              IDs follow the IT-DLH-2026-000124 format. All role names are fixed:
              Public, Ambulance, Police, Hospital, Host/Admin.
            </p>
          </div>
          <Feature
            icon={Bot}
            title="AI Route Engine"
            desc="Evaluates congestion, incidents, road capacity, historical data, and signal density — five inputs, one recommended route."
          />
          <Feature
            icon={Waves}
            title="Predictive Corridors"
            desc="Signals ahead are prepared before the ambulance arrives: READY → PREPARING → MONITORING. Predictive, not reactive."
          />
          <Feature
            icon={Landmark}
            title="Police Command Center"
            desc="Verify ambulances, run what-if simulations, manage incidents, and watch time saved in real time."
          />
          <Feature
            icon={MapPin}
            title="Interactive City Map"
            desc="Nine toggleable layers — traffic, signals, accidents, closures, hospitals, police, corridors, construction, waterlogging."
          />
          <Feature
            icon={Zap}
            title="Real-Time Updates"
            desc="Ambulance, hospital, police, and public views refresh live. No manual refresh during an active emergency."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="container py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>
            IntelliTraffic — simulated emergency traffic management prototype.
            Signal coordination is a simulation; physical signal control requires
            municipal infrastructure integration.
          </span>
          <span>Demo data · Delhi NCR · © 2026</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="space-y-3">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 border border-white/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-cyan-300" />
      </div>
      <h4 className="font-bold tracking-tight">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
