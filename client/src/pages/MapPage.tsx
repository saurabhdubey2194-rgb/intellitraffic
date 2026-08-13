import RoleShell from "@/components/RoleShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { trafficColor, trafficLevelLabel } from "@/lib/ui";
import {
  AlertTriangle,
  Building2,
  Clock,
  Construction,
  Hammer,
  Landmark,
  Loader2,
  Map as MapIcon,
  MapPin,
  Power,
  Shield,
  ShieldAlert,
  Signal,
  TrafficCone,
  Waves,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MapView } from "@/components/Map";
import { KANPUR_CENTER } from "@shared/intellitraffic";

type LayerKey =
  | "traffic"
  | "signals"
  | "accidents"
  | "closures"
  | "hospitals"
  | "police"
  | "corridors"
  | "construction"
  | "waterlogging";

type LayerIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const LAYERS: {
  key: LayerKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { key: "traffic", label: "Traffic Levels", icon: Power, color: "#3b82f6" },
  { key: "signals", label: "Traffic Signals", icon: Signal, color: "#64748b" },
  { key: "accidents", label: "Accidents", icon: AlertTriangle, color: "#ef4444" },
  { key: "closures", label: "Road Closures", icon: TrafficCone, color: "#f97316" },
  { key: "hospitals", label: "Hospitals", icon: Building2, color: "#10b981" },
  { key: "police", label: "Police Stations", icon: Shield, color: "#3b82f6" },
  { key: "corridors", label: "Emergency Corridors", icon: ShieldAlert, color: "#dc2626" },
  { key: "construction", label: "Construction", icon: Hammer, color: "#a855f7" },
  { key: "waterlogging", label: "Waterlogging", icon: Waves, color: "#0ea5e9" },
];

const INCIDENT_TYPE_LAYER: Record<string, LayerKey[]> = {
  accident: ["accidents"],
  road_blockage: ["closures"],
  construction: ["construction"],
  waterlogging: ["waterlogging"],
  heavy_congestion: ["traffic"],
  broken_signal: ["signals"],
  other: [],
};

export default function MapPage() {
  const [enabled, setEnabled] = useState<Set<LayerKey>>(
    () => new Set(["traffic", "signals", "hospitals", "police"] as LayerKey[]),
  );
  const toggle = (k: LayerKey) =>
    setEnabled(s => {
      const next = new Set(s);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const traffic = trpc.traffic.signals.useQuery();
  const incidents = trpc.traffic.incidents.useQuery({ status: "all", limit: 100 });
  const hospitals = trpc.admin.hospitals.useQuery();
  const police = trpc.admin.policeStations.useQuery();
  const corridors = trpc.emergencies.corridors.useQuery();
  const segments = trpc.admin.segments.useQuery(undefined, { retry: 1 });

  // Normalize: admin endpoints return rows directly; incidents return {rows}
  const signalRows = traffic.data ?? [];
  const incidentRows = incidents.data?.rows ?? [];
  const hospitalRows = (hospitals.data ?? []) as unknown as {
    id: number;
    name: string;
    lat: number | null;
    lng: number | null;
    emergencyContact: string | null;
    address: string | null;
  }[];
  const policeRows = (police.data ?? []) as unknown as {
    id: number;
    name: string;
    lat: number | null;
    lng: number | null;
    district: string | null;
    area: string | null;
  }[];

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<{
    name: string;
    level: string;
    corridorPhase?: string | null;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Clear marker click info when switching layers
  useEffect(() => setSelectedSignal(null), [enabled]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (selected) setSelected(null);

    const makeMarker = (
      pos: google.maps.LatLngLiteral,
      label: string,
      color: string,
      onClick?: () => void,
      iconSvg?: string,
    ) => {
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: label,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 0.92,
          strokeColor: "#0b1a33",
          strokeWeight: 2,
        },
        zIndex: onClick ? 1000 : 10,
      });
      if (onClick) {
        marker.addListener("click", onClick);
        marker.addListener("mouseover", () => marker.setOptions({ icon: { path: google.maps.SymbolPath.CIRCLE, scale: 13, fillColor: color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 } }));
        marker.addListener("mouseout", () => marker.setOptions({ icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: color, fillOpacity: 0.92, strokeColor: "#0b1a33", strokeWeight: 2 } }));
      }
      markersRef.current.push(marker);
      return marker;
    };

    // Traffic segments — colored polylines (traffic level simulated from currentLoad vs capacity)
    if (enabled.has("traffic") && segments.data) {
      for (const seg of segments.data) {
        const load = (seg.currentLoad ?? 30) / Math.max(seg.capacity ?? 100, 1);
        const level: string = load > 0.85 ? "severe" : load > 0.6 ? "heavy" : load > 0.3 ? "moderate" : "low";
        new google.maps.Polyline({
          path: [
            { lat: seg.fromLat, lng: seg.fromLng },
            { lat: seg.toLat, lng: seg.toLng },
          ],
          map,
          strokeColor: trafficColor(level),
          strokeWeight: 7,
          strokeOpacity: 0.85,
        }).addListener("click", () => setSelected(`${seg.name} — ${trafficLevelLabel(level)} (load ${Math.round(load * 100)}%)`));
      }
    }

    // Signals
    if (enabled.has("signals") && signalRows.length > 0) {
      for (const s of signalRows) {
        const level =
          s.trafficDensity === "severe" ? "severe" : s.trafficDensity === "heavy" ? "heavy" : s.trafficDensity === "moderate" ? "moderate" : "low";
        makeMarker(
          { lat: s.lat, lng: s.lng },
          `${s.signalCode} · ${s.intersection}`,
          s.corridorPhase === "ready"
            ? "#22c55e"
            : s.corridorPhase === "preparing"
              ? "#f59e0b"
              : s.corridorPhase === "monitoring"
                ? "#3b82f6"
                : trafficColor(level),
          () =>
            setSelectedSignal({
              name: `${s.signalCode} · ${s.intersection}`,
              level,
              corridorPhase: s.corridorPhase,
            }),
        );
      }
    }

    // Incidents by layer
    if (incidentRows.length > 0) {
      for (const inc of incidentRows) {
        const layers = INCIDENT_TYPE_LAYER[inc.type] || [];
        if (!layers.some(l => enabled.has(l))) continue;
        const color =
          inc.type === "accident" ? "#ef4444" :
          inc.type === "road_blockage" ? "#f97316" :
          inc.type === "construction" ? "#a855f7" :
          inc.type === "waterlogging" ? "#0ea5e9" :
          "#f59e0b";
        if (inc.lat == null || inc.lng == null) continue;
        makeMarker(
          { lat: inc.lat, lng: inc.lng },
          `${inc.reportId} — ${inc.type.replace(/_/g, " ")}`,
          color,
          () => setSelected(`${inc.reportId}: ${inc.type.replace(/_/g, " ")} — ${inc.status}`),
        );
      }
    }

    // Hospitals
    if (enabled.has("hospitals") && hospitalRows.length > 0) {
      for (const h of hospitalRows) {
        if (!h.lat || !h.lng) continue;
        makeMarker(
          { lat: h.lat, lng: h.lng },
          h.name,
          "#10b981",
          () => setSelected(`${h.name}${h.emergencyContact ? ` · ${h.emergencyContact}` : ""}`),
        );
      }
    }

    // Police stations
    if (enabled.has("police") && policeRows.length > 0) {
      for (const p of policeRows) {
        if (!p.lat || !p.lng) continue;
        makeMarker(
          { lat: p.lat, lng: p.lng },
          p.name,
          "#3b82f6",
          () => setSelected(`${p.name} — ${p.district ?? ""}`),
        );
      }
    }

    // Active corridors — red dashed route markers
    if (enabled.has("corridors") && corridors.data) {
      for (const c of corridors.data) {
        if (c.status !== "active") continue;
        if (c.ambulanceLat && c.ambulanceLng) {
          makeMarker(
            { lat: c.ambulanceLat, lng: c.ambulanceLng },
            `Corridor ${c.corridorId}`,
            "#dc2626",
            () => setSelected(`Emergency corridor ${c.corridorId} — ${c.status} (${c.progressPct ?? 0}% complete)`),
          );
        }
      }
    }
  }, [enabled, signalRows.length, incidentRows.length, hospitalRows.length, policeRows.length, corridors.data, segments.data]);

  const loading = traffic.isLoading || incidents.isLoading;

  return (
    <RoleShell demoMode>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4">
        {/* Layer controls */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapIcon className="h-4 w-4 text-emerald-300" />
              Map Layers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {LAYERS.map(l => (
              <label
                key={l.key}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent/60 transition-colors cursor-pointer"
              >
                <Checkbox
                  checked={enabled.has(l.key)}
                  onCheckedChange={() => toggle(l.key)}
                />
                {(() => {
                  const Icon = l.icon as unknown as LayerIcon;
                  return <Icon className="h-3.5 w-3.5" style={{ color: l.color }} />;
                })()}
                <span className="text-xs font-medium">{l.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-white/10 relative min-h-[420px] lg:min-h-[620px]">
          {loading ? (
            <div className="absolute inset-0 bg-card flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
            </div>
          ) : (
            <MapView
              initialCenter={KANPUR_CENTER}
              initialZoom={13}
              onMapReady={map => {
                mapRef.current = map;
                map.setOptions({
                  styles: [
                    { featureType: "poi", stylers: [{ visibility: "off" }] },
                    { featureType: "transit", stylers: [{ visibility: "off" }] },
                  ],
                });
              }}
              className="w-full h-full min-h-[420px] lg:min-h-[620px]"
            />
          )}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:max-w-md rounded-xl bg-[#0c1a33]/95 backdrop-blur border border-white/15 px-4 py-2.5 text-xs font-medium text-slate-100">
              {selected}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-5 text-[10px] text-slate-400 hover:text-white"
                onClick={() => setSelected(null)}
              >
                ✕
              </Button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-300" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            {selectedSignal ? (
              <div className="space-y-2">
                <p className="font-bold text-sm">{selectedSignal.name}</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Traffic:</span>
                  <Badge
                    className={`border-0 text-white`} style={{ backgroundColor: trafficColor(selectedSignal.level) } as React.CSSProperties}>
                    {trafficLevelLabel(selectedSignal.level)}
                  </Badge>
                </div>
                {selectedSignal.corridorPhase && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Corridor:</span>
                    <Badge
                      className={`border-0 uppercase ${selectedSignal.corridorPhase === "ready" ? "bg-green-500 text-white" : selectedSignal.corridorPhase === "preparing" ? "bg-amber-500 text-white" : "bg-blue-500 text-white"}`}
                    >
                      {selectedSignal.corridorPhase}
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                Click any marker or road segment on the map to inspect it. Toggle
                layers on the left. Colors: green low · amber moderate · orange
                heavy · red severe. Signal dots during an active corridor show
                preparation phase.
              </p>
            )}
            <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-2">
              <Stat icon={Signal} label="Signals" value={signalRows.length} />
              <Stat
                icon={Landmark}
                label="Incidents"
                value={incidents.data?.rows?.length ?? 0}
              />
              <Stat
                icon={Building2}
                label="Hospitals"
                value={hospitalRows.length}
              />
              <Stat
                icon={Shield}
                label="Stations"
                value={policeRows.length}
              />
            </div>
            <div className="border-t border-white/5 pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Legend
              </p>
              <div className="grid grid-cols-2 gap-1">
                {LAYERS.map(l => (
                  <div key={l.key} className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-[10px]">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-accent/50 border border-white/5 px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-emerald-300" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-base font-bold mt-0.5">{value}</p>
    </div>
  );
}
