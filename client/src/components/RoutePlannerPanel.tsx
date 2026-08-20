/**
 * Rapido-style route planning panel for the map.
 *
 * Features:
 * - Origin: "Current location" via browser geolocation + reverse geocoding +
 *   manual edit. Falls back to a pinned location with a note.
 * - Destination: free-text search backed by the Google Places Autocomplete
 *   service (proxy-authenticated), plus landmark quick picks and recent
 *   locations stored in localStorage.
 * - Select on Map mode: toggle and tap anywhere on the map to set destination.
 * - Add Stop (waypoints): up to 2 intermediate stops; removed from the panel
 *   when cleared.
 * - Route overview: calls routes.calculate (AI engine; clearly marked DEMO/
 *   simulated) and renders distance, computed ETA and traffic level per route.
 * - Request Green Corridor (ambulance role only): pre-fills the emergency form.
 *
 * The panel renders as a floating card overlay on mobile-first layout.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance, formatEta } from "@shared/intellitraffic";
import {
  ArrowRight,
  Clock,
  Crosshair,
  MapPin,
  Navigation,
  Pin,
  Plus,
  Siren,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type Point = {
  label: string;
  lat: number;
  lng: number;
  /** Human address for the overview (populated after geocoding). */
  address?: string;
};

type Stop = Point & { id: string };

type RouteCandidate = {
  name: string;
  distanceKm: number;
  etaSec: number;
  trafficLevel: string;
  score: number;
  reason?: string;
};

export type RoutePlannerPanelHandle = {
  getOrigin: () => Point | null;
  getDestination: () => Point | null;
  getStops: () => Stop[];
  clearSelection: () => void;
};

type Props = {
  /** Ref set by the parent map page once the Google Map is ready. */
  mapRef: React.MutableRefObject<google.maps.Map | null>;
  /** Whether the viewer is a verified ambulance user. */
  isAmbulance: boolean;
  /** Markers managed outside this component; we just add our own. */
  markersRef: React.MutableRefObject<google.maps.Marker[]>;
};

const RECENT_KEY = "it.recentLocations";
const MAX_RECENT = 5;

/** Landmark quick-picks to keep the demo useful even without Places data. */
const LANDMARKS: { name: string; lat: number; lng: number }[] = [
  { name: "Connaught Place, New Delhi", lat: 28.6329, lng: 77.2195 },
  { name: "Indira Gandhi Airport, New Delhi", lat: 28.5562, lng: 77.1 },
  { name: "Sector 62, Noida", lat: 28.6273, lng: 77.3687 },
  { name: "Gurugram Cyber Hub", lat: 28.4947, lng: 77.0884 },
  { name: "Dwarka Sector 21", lat: 28.5517, lng: 77.0485 },
  { name: "Vaishali, Ghaziabad", lat: 28.6402, lng: 77.3579 },
];

type PlannerState = {
  origin: Point | null;
  destination: Point | null;
  stops: Stop[];
};

export default function RoutePlannerPanel({ mapRef, isAmbulance, markersRef }: Props) {
  const [, navigate] = useLocation();
  const [state, setState] = useState<PlannerState>({ origin: null, destination: null, stops: [] });
  const [mode, setMode] = useState<"search" | "map">("search");
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [recent, setRecent] = useState<Point[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? (JSON.parse(raw) as Point[]) : [];
    } catch {
      return [];
    }
  });
  const [locating, setLocating] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const calc = trpc.routes.calculate.useMutation();
  const results = useMemo(() => (calc.data?.routes ?? []) as RouteCandidate[], [calc.data]);

  /* ---------- geolocation & reverse geocoding ---------- */
  const geocodePosition = useCallback(
    (lat: number, lng: number): Promise<string> =>
      new Promise(resolve => {
        if (!window.google) return resolve("Current location");
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (res, status) => {
          resolve(status === "OK" && res && res[0] ? res[0].formatted_address : "Current location");
        });
      }),
    [],
  );

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const p: Point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Current location",
          address: await geocodePosition(pos.coords.latitude, pos.coords.longitude),
        };
        setState(s => ({ ...s, origin: p }));
        setOriginQuery(p.address ?? "Current location");
        mapRef.current?.panTo({ lat: p.lat, lng: p.lng });
        mapRef.current?.setZoom(15);
        setLocating(false);
        toast.success("Using your current location");
      },
      () => {
        setLocating(false);
        toast.error("Location unavailable — enter your pickup point manually or tap the map.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  /* ---------- places autocomplete ---------- */
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);

  const fetchSuggestions = useCallback((query: string) => {
    if (!window.google?.maps?.places || query.trim().length < 3) {
      // fallback: match landmarks
      setSuggestions(
        query.trim().length >= 2
          ? LANDMARKS.filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 4)
              .map(l => ({ label: l.name, lat: l.lat, lng: l.lng }))
          : [],
      );
      return;
    }
    if (!autocompleteRef.current) autocompleteRef.current = new google.maps.places.AutocompleteService();
    autocompleteRef.current.getPlacePredictions(
      { input: query, componentRestrictions: { country: "in" }, types: ["geocode", "establishment"] },
      (res, status) => {
        if (status === "OK" && res && res.length > 0) {
          // resolve coordinates via Places fetchFields (no map attachment needed)
          Promise.all(
            res.slice(0, 5).map(async r => {
              try {
                const place = new google.maps.places.Place({ id: r.place_id });
                await place.fetchFields({ fields: ["displayName", "location"] });
                const lat = place.location?.lat?.() ?? 0;
                const lng = place.location?.lng?.() ?? 0;
                return { label: r.description, lat, lng };
              } catch {
                return null;
              }
            }),
          ).then(coords => {
            setSuggestions(
              coords.filter((c): c is NonNullable<typeof c> => c !== null && c.lat !== 0),
            );
          });
        } else {
          setSuggestions(
            LANDMARKS.filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 4)
              .map(l => ({ label: l.name, lat: l.lat, lng: l.lng })),
          );
        }
      },
    );
  }, []);

  const setDestinationFromSuggestion = (s: { label: string; lat: number; lng: number }) => {
    const p: Point = { lat: s.lat, lng: s.lng, label: s.label };
    setState(st => ({ ...st, destination: p }));
    setDestQuery(s.label);
    setSuggestions([]);
    setSuggestionsOpen(false);
    pushRecent(p);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: s.lat, lng: s.lng });
    }
  };

  const pushRecent = (p: Point) => {
    setRecent(prev => {
      const dedup = prev.filter(r => !(Math.abs(r.lat - p.lat) < 1e-6 && Math.abs(r.lng - p.lng) < 1e-6));
      const next = [p, ...dedup].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  /* ---------- select-on-map ---------- */
  const mapTapHandlerRef = useRef<google.maps.MapsEventListener | null>(null);

  const toggleMapMode = () => {
    if (mode === "map") {
      setMode("search");
      mapTapHandlerRef.current?.remove();
      mapTapHandlerRef.current = null;
      return;
    }
    setMode("map");
    setSuggestions([]);
    setSuggestionsOpen(false);
    const map = mapRef.current;
    if (!map) return;
    mapTapHandlerRef.current = map.addListener("click", (ev: google.maps.MapMouseEvent) => {
      const pos = ev.latLng?.toJSON();
      if (!pos) return;
      geocodePosition(pos.lat, pos.lng).then(address => {
        const p: Point = { lat: pos.lat, lng: pos.lng, label: address, address };
        if (state.destination) {
          // adding a stop instead of replacing destination
          addStop(p);
        } else {
          setState(st => ({ ...st, destination: p }));
          setDestQuery(address);
          pushRecent(p);
        }
        mapRef.current?.panTo(pos);
      });
    });
    toast.info("Tap the map to drop the destination pin");
  };

  useEffect(() => {
    return () => {
      mapTapHandlerRef.current?.remove();
    };
  }, []);

  /* ---------- stops ---------- */
  const addStop = (p: Point) => {
    if (state.stops.length >= 2) {
      toast.error("Maximum 2 stops allowed.");
      return;
    }
    setState(st => ({
      ...st,
      stops: [...st.stops, { ...p, id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }],
    }));
  };

  const removeStop = (id: string) => {
    setState(st => ({ ...st, stops: st.stops.filter(s => s.id !== id) }));
  };

  /* ---------- calculate route ---------- */
  const findRoutes = () => {
    if (!state.origin) {
      toast.error("Set your pickup location first — use current location or enter an address.");
      return;
    }
    if (!state.destination) {
      toast.error("Choose a destination first — search, pick from recents, or tap the map.");
      return;
    }
    calc.mutate({
      fromLat: state.origin.lat,
      fromLng: state.origin.lng,
      toLat: state.destination.lat,
      toLng: state.destination.lng,
      emergency: false,
      fromAddress: state.origin.address ?? state.origin.label,
      toAddress: state.destination.address ?? state.destination.label,
    });
    // pan to show the corridor
    if (mapRef.current) {
      mapRef.current.panToBounds(
        new google.maps.LatLngBounds(
          new google.maps.LatLng(
            Math.min(state.origin.lat, state.destination.lat) - 0.01,
            Math.min(state.origin.lng, state.destination.lng) - 0.01,
          ),
          new google.maps.LatLng(
            Math.max(state.origin.lat, state.destination.lat) + 0.01,
            Math.max(state.origin.lng, state.destination.lng) + 0.01,
          ),
        ),
      );
    }
  };

  const clearSelection = () => {
    setState({ origin: null, destination: null, stops: [] });
    setOriginQuery("");
    setDestQuery("");
    setSuggestions([]);
    setMode("search");
    calc.reset();
  };

  /* ---------- emergency handoff ---------- */
  const requestCorridor = () => {
    if (!state.origin || !state.destination) {
      toast.error("Set pickup and destination before requesting a corridor.");
      return;
    }
    const payload = {
      originLat: state.origin.lat,
      originLng: state.origin.lng,
      originAddress: state.origin.address ?? state.origin.label,
      destinationLat: state.destination.lat,
      destinationLng: state.destination.lng,
      destinationAddress: state.destination.address ?? state.destination.label,
      stops: state.stops.map(s => ({ lat: s.lat, lng: s.lng, address: s.address ?? s.label })),
    };
    localStorage.setItem("it.emergencyRoute", JSON.stringify(payload));
    navigate("/emergency");
  };

  /* ---------- map markers ---------- */
  const originMarkerRef = useRef<google.maps.Marker | null>(null);
  const destMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (originMarkerRef.current) originMarkerRef.current.setMap(null);
    if (state.origin) {
      originMarkerRef.current = new google.maps.Marker({
        position: { lat: state.origin.lat, lng: state.origin.lng },
        map,
        title: "Pickup",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#0ea5e9",
          fillOpacity: 1,
          strokeColor: "#0b1a33",
          strokeWeight: 2,
        },
        zIndex: 2000,
      });
    }
    if (destMarkerRef.current) destMarkerRef.current.setMap(null);
    if (state.destination) {
      destMarkerRef.current = new google.maps.Marker({
        position: { lat: state.destination.lat, lng: state.destination.lng },
        map,
        title: "Destination",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#0b1a33",
          strokeWeight: 2,
        },
        zIndex: 2000,
      });
    }
  }, [state.origin, state.destination, mapRef]);

  /* ---------- render ---------- */
  const readyToCalc = Boolean(state.origin && state.destination);

  return (
    <div className="absolute top-3 left-3 right-3 md:right-auto md:w-[340px] z-10 pointer-events-none">
      <div className="rounded-2xl bg-[#0c1a33]/95 backdrop-blur border border-white/15 shadow-2xl p-4 pointer-events-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black tracking-tight flex items-center gap-2">
            <Navigation className="h-4 w-4 text-emerald-300" /> Route Planner
          </p>
          <div className="flex rounded-lg border border-white/10 overflow-hidden text-[10px] font-bold">
            <button
              onClick={() => { toggleMapMode(); }}
              className={`px-2.5 py-1 transition-colors ${mode === "search" ? "bg-emerald-500/20 text-emerald-300" : "text-muted-foreground hover:text-foreground"}`}
            >
              Search
            </button>
            <button
              onClick={toggleMapMode}
              className={`px-2.5 py-1 transition-colors ${mode === "map" ? "bg-emerald-500/20 text-emerald-300" : "text-muted-foreground hover:text-foreground"}`}
            >
              Select on Map
            </button>
          </div>
        </div>

        {mode === "map" && (
          <div className="mb-2.5 rounded-lg bg-sky-500/10 border border-sky-400/25 px-3 py-1.5 text-[11px] text-sky-200 flex items-center gap-2">
            <Crosshair className="h-3.5 w-3.5 shrink-0" />
            Tap anywhere on the map to set {state.destination ? "an extra stop" : "the destination"}.
          </div>
        )}

        {/* Origin */}
        <div className="space-y-1.5">
          <div className="flex items-stretch gap-1.5">
            <div className="flex flex-col items-center pt-3 pr-1">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              <span className="w-px flex-1 bg-white/20 my-0.5" />
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Input
                  value={originQuery}
                  onChange={e => setOriginQuery(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === "Enter" && originQuery.trim().length >= 3) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: originQuery }, (res, status) => {
        if (status === "OK" && res && res[0]) {
                          const loc = res[0].geometry.location;
                          const p: Point = {
                            lat: loc.lat(),
                            lng: loc.lng(),
                            label: res[0].formatted_address,
                            address: res[0].formatted_address,
                          };
                          setState(s => ({ ...s, origin: p }));
                          mapRef.current?.panTo({ lat: loc.lat(), lng: loc.lng() });
                        } else {
                          toast.error("Could not find that address — try again.");
                        }
                      });
                    }
                  }}
                  placeholder="Pickup location"
                  className="h-8 text-xs bg-white/5"
                  aria-label="Pickup location"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={locating}
                  onClick={useMyLocation}
                  className="h-8 shrink-0 border-white/15 text-[10px] font-semibold px-2"
                  title="Use my current location"
                >
                  {locating ? (
                    <Clock className="h-3 w-3 animate-spin" />
                  ) : (
                    <Crosshair className="h-3 w-3" />
                  )}
                </Button>
              </div>
              {state.origin && (
                <p className="text-[10px] text-sky-300 truncate pl-0.5">
                  <Pin className="h-2.5 w-2.5 inline mr-1" />
                  {state.origin.address ?? state.origin.label}
                </p>
              )}
              <Input
                value={destQuery}
                onChange={e => {
                  setDestQuery(e.target.value);
                  setSuggestionsOpen(true);
                  fetchSuggestions(e.target.value);
                }}
                onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                placeholder="Where to? (destination)"
                className="h-8 text-xs bg-white/5"
                aria-label="Destination search"
              />
              {suggestionsOpen && suggestions.length > 0 && (
                <ul className="max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-[#0a1629] shadow-xl divide-y divide-white/5">
                  {suggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-[11px] hover:bg-emerald-500/10 transition-colors truncate"
                        onMouseDown={e => {
                          e.preventDefault();
                          setDestinationFromSuggestion(s);
                        }}
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {state.destination && (
                <p className="text-[10px] text-red-300 truncate pl-0.5">
                  <Pin className="h-2.5 w-2.5 inline mr-1" />
                  {state.destination.address ?? state.destination.label}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stops */}
        {state.stops.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {state.stops.map((stop, i) => (
              <div key={stop.id} className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5">
                <Plus className="h-3 w-3 text-amber-300 shrink-0" />
                <span className="text-[10px] truncate flex-1">
                  Stop {i + 1}: {stop.address ?? stop.label}
                </span>
                <button
                  onClick={() => removeStop(stop.id)}
                  className="text-muted-foreground hover:text-red-300 transition-colors"
                  aria-label={`Remove stop ${i + 1}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recent locations */}
        {recent.length > 0 && !state.destination && (
          <div className="mt-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Recent</p>
            <div className="flex flex-wrap gap-1.5">
              {recent.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDestinationFromSuggestion({ label: r.label, lat: r.lat, lng: r.lng })}
                  className="text-[10px] rounded-md border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:border-emerald-400/40 hover:text-emerald-200 transition-colors truncate max-w-[140px]"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Landmark quick picks */}
        {!state.destination && (
          <div className="mt-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Quick picks</p>
            <div className="flex flex-wrap gap-1.5">
              {LANDMARKS.slice(0, 4).map(l => (
                <button
                  key={l.name}
                  type="button"
                  onClick={() => setDestinationFromSuggestion({ label: l.name, lat: l.lat, lng: l.lng })}
                  className="text-[10px] rounded-md border border-white/10 bg-white/5 px-2 py-1 text-slate-200 hover:border-emerald-400/40 hover:text-emerald-200 transition-colors truncate max-w-[150px]"
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <Button
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-9"
            disabled={!readyToCalc || calc.isPending}
            onClick={findRoutes}
          >
            {calc.isPending ? (
              <Clock className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
            )}
            Find Routes
          </Button>
          {state.destination && (
            <Button variant="outline" size="sm" className="h-9 border-white/15 text-[10px]" onClick={clearSelection}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Emergency corridor (ambulance only) */}
        {isAmbulance && readyToCalc && (
          <Button
            variant="destructive"
            size="sm"
            className="mt-2 w-full bg-red-500 hover:bg-red-400 font-bold text-xs h-9"
            onClick={requestCorridor}
          >
            <Siren className="h-3.5 w-3.5 mr-1.5" />
            Request Green Corridor
          </Button>
        )}

        {/* Route overview */}
        {(calc.isPending || results.length > 0 || calc.error) && (
          <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
            {calc.isPending && (
              <div className="space-y-1.5">
                <Skeleton className="h-12 w-full bg-white/5" />
                <Skeleton className="h-12 w-full bg-white/5" />
              </div>
            )}
            {calc.error && (
              <p className="text-[11px] text-red-300">{calc.error.message}</p>
            )}
            {results.map(r => (
              <div
                key={r.name}
                className={`rounded-lg border px-3 py-2 ${r.name.includes("Recommended") ? "border-emerald-400/40 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold truncate">
                    {r.name.includes("Recommended") ? (
                      <span className="text-emerald-300">AI Recommended · </span>
                    ) : null}
                    {r.name.replace("AI RECOMMENDED", "").trim()}
                  </p>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-white"
                    style={{
                      backgroundColor:
                        r.trafficLevel === "low" ? "#22c55e" : r.trafficLevel === "moderate" ? "#f59e0b" : "#ef4444",
                    }}
                  >
                    {r.trafficLevel} traffic
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-sky-300" /> {formatDistance(r.distanceKm)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-300" /> {formatEta(r.etaSec)}
                  </span>
                </div>
                {r.reason && (
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{r.reason}</p>
                )}
              </div>
            ))}
            {calc.data?.simulated && (
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                Demo / simulated data — ETA & traffic computed by the AI engine
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
