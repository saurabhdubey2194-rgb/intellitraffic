/** IntelliTraffic shared constants & types used by both client and server. */

export const INTELLITRAFFIC_ROLES = [
  "public",
  "ambulance",
  "police",
  "hospital",
  "host",
] as const;

export type IntelliTrafficRole = (typeof INTELLITRAFFIC_ROLES)[number];

export const VERIFICATION_STATUSES = [
  "pending",
  "under_review",
  "verified",
  "rejected",
  "suspended",
  "expired",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const EMERGENCY_STATUSES = [
  "submitted",
  "under_verification",
  "approved",
  "corridor_active",
  "in_transit",
  "arrived",
  "completed",
  "rejected",
  "cancelled",
] as const;

export const INCIDENT_TYPES = [
  "accident",
  "road_blockage",
  "waterlogging",
  "construction",
  "broken_signal",
  "heavy_congestion",
  "other",
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const TRAFFIC_LEVEL = ["low", "moderate", "heavy", "severe"] as const;
export const TRAFFIC_LEVELS = TRAFFIC_LEVEL;
export const PRIORITY = ["high", "critical", "extreme"] as const;
export const SIGNAL_PREP = ["normal", "monitoring", "preparing", "ready"] as const;
export const EMERGENCY_STATUS = [
  "submitted",
  "approved",
  "corridor_active",
  "rejected",
  "arrived",
  "completed",
] as const;
export const ROLE = INTELLITRAFFIC_ROLES;
export type TrafficLevel = (typeof TRAFFIC_LEVELS)[number];

/** Delhi NCR demo area bounding box. */
export const CITY_CENTER = { lat: 28.6139, lng: 77.209 } as const;
export const CITY_CENTER_DLH = CITY_CENTER; export const KANPUR_CENTER = CITY_CENTER;
export const DEMO_DISTRICT = "New Delhi";
export const DEMO_STATE = "Delhi NCR";
export const DEMO_CITY = "Delhi NCR";
export const CITY_CODE = "DLH";

/** Delhi NCR districts for seeding, filtering and display. */
export const NCR_DISTRICTS = [
  "New Delhi",
  "Noida",
  "Greater Noida",
  "Ghaziabad",
  "Gurugram",
  "Faridabad",
  "Dwarka",
  "South Delhi",
] as const;
export type NcrDistrict = (typeof NCR_DISTRICTS)[number];

export function generateReportId(sequence: number): string {
  const year = new Date().getUTCFullYear();
  const seq = String(sequence).padStart(6, "0");
  return `IT-${CITY_CODE}-${year}-${seq}`;
}

export function generateRequestId(sequence: number): string {
  const year = new Date().getUTCFullYear();
  return `ER-${CITY_CODE}-${year}-${String(sequence).padStart(6, "0")}`;
}

export function generateCorridorId(sequence: number): string {
  const year = new Date().getUTCFullYear();
  return `EC-${CITY_CODE}-${year}-${String(sequence).padStart(6, "0")}`;
}

/** Activity id — random suffix keeps it unique without a counter round-trip. */
export function generateActivityId(): string {
  const year = new Date().getUTCFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ACT-${CITY_CODE}-${year}-${rand}`;
}

export function generateTripId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TRIP-${rand}`;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatEta(seconds: number): string {
  if (!seconds || seconds < 0) return "—";
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "<1 min";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} hr ${m} min`;
}

export function formatDistance(km?: number | null): string {
  if (!km) return "—";
  return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}
