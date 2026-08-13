/**
 * IntelliTraffic Route Engine
 *
 * Evaluates route candidates using the five required inputs:
 * congestion, incidents, road capacity, historical data, and signal density.
 *
 * IMPORTANT: All traffic values in this prototype are SIMULATED/demo data
 * unless backed by an authorized live traffic infrastructure integration.
 */
import { haversineKm } from "@shared/intellitraffic";
import type {
  TrafficIncident as IncidentRow,
  TrafficSignal as SignalRow,
  RoadSegment as SegmentRow,
} from "../drizzle/schema";

export interface RouteCandidate {
  name: string;
  waypoints: Array<{ lat: number; lng: number; name: string }>;
  baseSpeedKmh: number;
  signalCount: number;
  segmentIds?: number[];
  historicalCongestionFactor: number; // 1.0 normal, >1 slower at this hour
}

export interface RouteEvaluationContext {
  incidents: IncidentRow[];
  signals: SignalRow[];
  segments: SegmentRow[];
  emergency: boolean;
}

export interface EvaluatedRoute {
  name: string;
  waypoints: Array<{ lat: number; lng: number; name: string }>;
  distanceKm: number;
  baseEtaSec: number;
  etaSec: number;
  congestionDelayMin: number;
  incidentDelayMin: number;
  signalDelayMin: number;
  historicalDelayMin: number;
  trafficLevel: "low" | "moderate" | "heavy" | "severe";
  score: number; // 0-100, higher = better
  scoreBreakdown: {
    congestion: number;
    incidents: number;
    capacity: number;
    historical: number;
    signalDensity: number;
  };
}

/** Haversine chain distance along waypoints. */
function chainDistanceKm(waypoints: RouteCandidate["waypoints"]): number {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    total += haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
  }
  return total;
}

/** Count incidents within ~500m of any route waypoint. */
function nearbyIncidentDelay(
  waypoints: RouteCandidate["waypoints"],
  incidents: IncidentRow[]
): { count: number; delayMin: number } {
  let count = 0;
  let delay = 0;
  const severityMinutes: Record<string, number> = {
    accident: 12,
    road_blockage: 15,
    waterlogging: 8,
    construction: 6,
    broken_signal: 5,
    heavy_congestion: 4,
    other: 3,
  };
  for (const wp of waypoints) {
    for (const inc of incidents) {
      if (!inc.lat || !inc.lng) continue;
      if (haversineKm(wp.lat, wp.lng, inc.lat, inc.lng) <= 0.5) {
        if (inc.status === "resolved" || inc.status === "false_report") continue;
        count++;
        delay += severityMinutes[inc.type] ?? 3;
      }
    }
  }
  return { count, delayMin: delay };
}

/** Signal delay per signal along the route (avg wait half cycle). */
function signalDelay(
  waypoints: RouteCandidate["waypoints"],
  signals: SignalRow[]
): { count: number; delayMin: number; densityScore: number } {
  let count = 0;
  for (const wp of waypoints) {
    for (const s of signals) {
      if (haversineKm(wp.lat, wp.lng, s.lat, s.lng) <= 0.4) {
        count++;
        break;
      }
    }
  }
  const avgCycleSec = 120;
  const delayMin = (count * avgCycleSec) / 60 / 2;
  // densityScore: fewer signals per km => better
  const totalKm = Math.max(chainDistanceKm(waypoints), 0.1);
  const densityPerKm = count / totalKm;
  const densityScore = Math.max(0, 100 - densityPerKm * 25);
  return { count, delayMin, densityScore };
}

/** Congestion delay from road segment load vs capacity (current simulated load). */
function congestionDelay(
  waypoints: RouteCandidate["waypoints"],
  segments: SegmentRow[]
): { level: "low" | "moderate" | "heavy" | "severe"; delayMin: number; score: number; capacityScore: number } {
  let totalLoad = 0;
  let totalCapacity = 0;
  let matched = false;
  for (const wp of waypoints) {
    for (const seg of segments) {
      const midLat = (seg.fromLat + seg.toLat) / 2;
      const midLng = (seg.fromLng + seg.toLng) / 2;
      if (haversineKm(wp.lat, wp.lng, midLat, midLng) <= 0.6) {
        totalLoad += seg.currentLoad ?? 30;
        totalCapacity += seg.capacity ?? 100;
        matched = true;
      }
    }
  }
  if (!matched) return { level: "moderate", delayMin: 2, score: 60, capacityScore: 70 };
  const utilization = totalCapacity > 0 ? totalLoad / totalCapacity : 0.3;
  let level: "low" | "moderate" | "heavy" | "severe" = "low";
  let score = 90;
  let delayMin = 1;
  if (utilization > 0.75) {
    level = "severe";
    score = 15;
    delayMin = 18;
  } else if (utilization > 0.55) {
    level = "heavy";
    score = 35;
    delayMin = 10;
  } else if (utilization > 0.35) {
    level = "moderate";
    score = 60;
    delayMin = 4;
  } else {
    level = "low";
    score = 90;
    delayMin = 1;
  }
  const capacityScore = Math.max(0, 100 - utilization * 100);
  return { level, delayMin, score, capacityScore };
}

/**
 * Score a single candidate. Weights match the five required inputs:
 * congestion, incidents, road capacity, historical data, signal density.
 */
export function evaluateRoute(
  candidate: RouteCandidate,
  ctx: RouteEvaluationContext
): EvaluatedRoute {
  const distanceKm = chainDistanceKm(candidate.waypoints);
  const speed = ctx.emergency
    ? Math.max(candidate.baseSpeedKmh, 45) * 1.25
    : candidate.baseSpeedKmh;
  const baseEtaSec = (distanceKm / speed) * 3600;

  const cong = congestionDelay(candidate.waypoints, ctx.segments);
  const inc = nearbyIncidentDelay(candidate.waypoints, ctx.incidents);
  const sig = signalDelay(candidate.waypoints, ctx.signals);

  // Historical congestion factor (simulated profile for this hour of day)
  const historicalDelayMin = Math.max(
    0,
    (baseEtaSec / 60) * (candidate.historicalCongestionFactor - 1)
  );

  const totalDelayMin = cong.delayMin + inc.delayMin + sig.delayMin + historicalDelayMin;
  const etaSec = Math.round(baseEtaSec + totalDelayMin * 60);

  // Composite score: congestion 30%, incidents 25%, capacity 15%, historical 10%, signals 20%
  const score = Math.round(
    cong.score * 0.3 +
      Math.max(0, 100 - inc.count * 30) * 0.25 +
      cong.capacityScore * 0.15 +
      Math.max(0, 100 - (candidate.historicalCongestionFactor - 1) * 60) * 0.1 +
      sig.densityScore * 0.2
  );

  return {
    name: candidate.name,
    waypoints: candidate.waypoints,
    distanceKm: Math.round(distanceKm * 10) / 10,
    baseEtaSec: Math.round(baseEtaSec),
    etaSec,
    congestionDelayMin: Math.round(cong.delayMin),
    incidentDelayMin: Math.round(inc.delayMin),
    signalDelayMin: Math.round(sig.delayMin * 10) / 10,
    historicalDelayMin: Math.round(historicalDelayMin),
    trafficLevel: cong.level,
    score: Math.min(100, Math.max(0, score)),
    scoreBreakdown: {
      congestion: Math.round(cong.score),
      incidents: Math.round(Math.max(0, 100 - inc.count * 30)),
      capacity: Math.round(cong.capacityScore),
      historical: Math.round(Math.max(0, 100 - (candidate.historicalCongestionFactor - 1) * 60)),
      signalDensity: Math.round(sig.densityScore),
    },
  };
}

export function rankRoutes(
  candidates: RouteCandidate[],
  ctx: RouteEvaluationContext
): EvaluatedRoute[] {
  const evaluated = candidates.map(c => evaluateRoute(c, ctx));
  evaluated.sort((a, b) => b.score - a.score);
  const best = evaluated[0];
  const second = evaluated[1];
  for (let i = 0; i < evaluated.length; i++) {
    evaluated[i].name =
      i === 0
        ? `Route ${String.fromCharCode(65 + i)} — Recommended`
        : `Route ${String.fromCharCode(65 + i)}`;
  }
  if (best && second) {
    const savedMin = Math.round((second.etaSec - best.etaSec) / 60);
    if (savedMin > 0) {
      best.name = "Route A — Recommended";
    }
  }
  return evaluated;
}

/** Predicted congestion progression for predictive-traffic display (simulated). */
export function predictTrafficLevels(currentLevel: string): Array<{ atMin: number; level: "low" | "moderate" | "heavy" | "severe" }> {
  const order = ["low", "moderate", "heavy", "severe"] as const;
  const idx = order.indexOf(currentLevel as typeof order[number]);
  const base = idx === -1 ? 1 : idx;
  return [
    { atMin: 5, level: order[Math.min(3, base + 1)] },
    { atMin: 10, level: order[Math.min(3, base + 2)] },
    { atMin: 15, level: order[Math.min(3, base + 2)] },
  ];
}
