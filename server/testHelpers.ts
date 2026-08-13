import type { RouteCandidate } from "./routeEngine";

/** Three route candidates: direct, ring-road detour, inner-city alternative. */
export function buildCandidates(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): RouteCandidate[] {
  return [
    {
      name: "Route A",
      waypoints: [
        { lat: fromLat, lng: fromLng, name: "Start" },
        { lat: (fromLat + toLat) / 2, lng: (fromLng + toLng) / 2, name: "Midpoint" },
        { lat: toLat, lng: toLng, name: "Destination" },
      ],
      baseSpeedKmh: 32,
      signalCount: 0,
      historicalCongestionFactor: 1.15,
    },
    {
      name: "Route B",
      waypoints: [
        { lat: fromLat, lng: fromLng, name: "Start" },
        { lat: fromLat + (toLat - fromLat) * 0.3, lng: fromLng + 0.02, name: "Ring Road East" },
        { lat: toLat - (toLat - fromLat) * 0.3, lng: toLng + 0.015, name: "Bypass West" },
        { lat: toLat, lng: toLng, name: "Destination" },
      ],
      baseSpeedKmh: 42,
      signalCount: 0,
      historicalCongestionFactor: 0.95,
    },
    {
      name: "Route C",
      waypoints: [
        { lat: fromLat, lng: fromLng, name: "Start" },
        { lat: fromLat - 0.01, lng: (fromLng + toLng) / 2 - 0.01, name: "City Centre" },
        { lat: toLat, lng: toLng, name: "Destination" },
      ],
      baseSpeedKmh: 24,
      signalCount: 0,
      historicalCongestionFactor: 1.35,
    },
  ];
}
