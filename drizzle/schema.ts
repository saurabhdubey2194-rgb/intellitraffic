import {
  boolean,
  datetime,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * IntelliTraffic adds registration fields, role-based RBAC,
 * and verification statuses beyond the template defaults.
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", [
      "public",
      "ambulance",
      "police",
      "hospital",
      "host",
      "user",
      "admin",
    ]).default("public").notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "pending",
      "under_review",
      "verified",
      "rejected",
      "suspended",
      "expired",
    ]).default("pending").notNull(),
    verificationNote: text("verificationNote"),
    phone: varchar("phone", { length: 32 }),
    city: varchar("city", { length: 128 }),
    district: varchar("district", { length: 128 }),
    state: varchar("state", { length: 128 }),
    suspendedAt: datetime("suspendedAt"),
    suspendedReason: text("suspendedReason"),
    createdAt: datetime("createdAt").default(new Date()).notNull(),
    updatedAt: datetime("updatedAt").default(new Date()).notNull(),
    lastSignedIn: datetime("lastSignedIn").default(new Date()).notNull(),
  }
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Ambulance = typeof ambulances.$inferSelect;
export type Hospital = typeof hospitals.$inferSelect;
export type PoliceStation = typeof policeStations.$inferSelect;
export type TrafficSignal = typeof trafficSignals.$inferSelect;
export type RoadSegment = typeof roadSegments.$inferSelect;
export type TrafficIncident = typeof trafficIncidents.$inferSelect;
export type EmergencyRequest = typeof emergencyRequests.$inferSelect;
export type EmergencyCorridor = typeof emergencyCorridors.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

// ---------- Role-specific profile tables ----------

export const ambulances = mysqlTable("ambulances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  driverName: varchar("driverName", { length: 200 }).notNull(),
  registrationNumber: varchar("registrationNumber", { length: 32 }).notNull(),
  driverLicenceNumber: varchar("driverLicenceNumber", { length: 64 }),
  permitNumber: varchar("permitNumber", { length: 64 }),
  insuranceNumber: varchar("insuranceNumber", { length: 64 }),
  insuranceExpiry: datetime("insuranceExpiry"),
  hospitalAssociation: varchar("hospitalAssociation", { length: 200 }),
  hospitalId: int("hospitalId"),
  operatingDistrict: varchar("operatingDistrict", { length: 128 }),
  ambulanceType: varchar("ambulanceType", { length: 64 }),
  trustScore: int("trustScore").default(100),
  totalRequests: int("totalRequests").default(0),
  verifiedRequests: int("verifiedRequests").default(0),
  suspiciousRequests: int("suspiciousRequests").default(0),
  rejectedRequests: int("rejectedRequests").default(0),
  lat: float("lat"),
  lng: float("lng"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
  updatedAt: datetime("updatedAt").default(new Date()).notNull(),
});

export const hospitals = mysqlTable("hospitals", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  userId: int("userId"),
  registrationNumber: varchar("registrationNumber", { length: 64 }),
  contactName: varchar("contactName", { length: 200 }),
  contactNumber: varchar("contactNumber", { length: 32 }),
  emergencyContact: varchar("emergencyContact", { length: 32 }),
  address: text("address"),
  district: varchar("district", { length: 128 }),
  state: varchar("state", { length: 128 }),
  hospitalIdCode: varchar("hospitalIdCode", { length: 32 }),
  lat: float("lat"),
  lng: float("lng"),
  emergencyAvailable: boolean("emergencyAvailable").default(true),
  bedsAvailable: int("bedsAvailable").default(0),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
  updatedAt: datetime("updatedAt").default(new Date()).notNull(),
});

export const policeStations = mysqlTable("policeStations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  userId: int("userId"),
  officerName: varchar("officerName", { length: 200 }),
  officerId: varchar("officerId", { length: 64 }),
  designation: varchar("designation", { length: 128 }),
  district: varchar("district", { length: 128 }),
  state: varchar("state", { length: 128 }),
  area: varchar("area", { length: 128 }),
  lat: float("lat"),
  lng: float("lng"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
  updatedAt: datetime("updatedAt").default(new Date()).notNull(),
});

// ---------- Operational tables ----------

export const trafficSignals = mysqlTable("trafficSignals", {
  id: int("id").autoincrement().primaryKey(),
  signalCode: varchar("signalCode", { length: 32 }).notNull(),
  intersection: varchar("intersection", { length: 200 }).notNull(),
  lat: float("lat").notNull(),
  lng: float("lng").notNull(),
  district: varchar("district", { length: 128 }),
  state: varchar("state", { length: 128 }),
  area: varchar("area", { length: 128 }),
  currentPhase: varchar("currentPhase", { length: 32 }).default("green"),
  trafficDensity: mysqlEnum("trafficDensity", ["low", "moderate", "heavy", "severe"])
    .default("moderate"),
  avgSpeedKmh: float("avgSpeedKmh").default(30),
  queueLevel: mysqlEnum("queueLevel", ["low", "medium", "high", "very_high"])
    .default("medium"),
  connected: boolean("connected").default(true),
  emergencyPriority: boolean("emergencyPriority").default(false),
  corridorPhase: mysqlEnum("corridorPhase", [
    "normal",
    "monitoring",
    "preparing",
    "ready",
  ]).default("normal"),
  corridorId: int("corridorId"),
  cycleSec: int("cycleSec").default(120),
  lastUpdated: datetime("lastUpdated").default(new Date()).notNull(),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export const roadSegments = mysqlTable("roadSegments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  fromLat: float("fromLat").notNull(),
  fromLng: float("fromLng").notNull(),
  toLat: float("toLat").notNull(),
  toLng: float("toLng").notNull(),
  district: varchar("district", { length: 128 }),
  roadType: mysqlEnum("roadType", ["national_highway", "state_highway", "main_road", "inner_road"])
    .default("main_road"),
  capacity: int("capacity").default(100),
  currentLoad: int("currentLoad").default(30),
  baseSpeedKmh: float("baseSpeedKmh").default(45),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export const trafficIncidents = mysqlTable("trafficIncidents", {
  id: int("id").autoincrement().primaryKey(),
  reportId: varchar("reportId", { length: 32 }),
  reportedByUserId: int("reportedByUserId"),
  type: mysqlEnum("type", [
    "accident",
    "road_blockage",
    "waterlogging",
    "construction",
    "broken_signal",
    "heavy_congestion",
    "other",
  ]).notNull(),
  description: text("description"),
  lat: float("lat"),
  lng: float("lng"),
  district: varchar("district", { length: 128 }),
  status: mysqlEnum("status", ["reported", "investigating", "verified", "resolved", "false_report"])
    .default("reported"),
  handledByStationId: int("handledByStationId"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
  resolvedAt: datetime("resolvedAt"),
});

export const emergencyRequests = mysqlTable("emergencyRequests", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 32 }).notNull(),
  ambulanceId: int("ambulanceId").notNull(),
  ambulanceUserId: int("ambulanceUserId").notNull(),
  hospitalId: int("hospitalId").notNull(),
  patientCondition: varchar("patientCondition", { length: 200 }),
  priority: mysqlEnum("priority", ["high", "critical", "extreme"]).default("high"),
  status: mysqlEnum("status", [
    "submitted",
    "under_verification",
    "approved",
    "corridor_active",
    "in_transit",
    "arrived",
    "completed",
    "rejected",
    "cancelled",
  ]).default("submitted"),
  suspicious: boolean("suspicious").default(false),
  reviewedByStationId: int("reviewedByStationId"),
  reviewNote: text("reviewNote"),
  corridorId: int("corridorId"),
  routeId: int("routeId"),
  fromLat: float("fromLat"),
  fromLng: float("fromLng"),
  toLat: float("toLat"),
  toLng: float("toLng"),
  etaSec: int("etaSec"),
  distanceKm: float("distanceKm"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
  updatedAt: datetime("updatedAt").default(new Date()).notNull(),
  completedAt: datetime("completedAt"),
});

export const emergencyCorridors = mysqlTable("emergencyCorridors", {
  id: int("id").autoincrement().primaryKey(),
  corridorId: varchar("corridorId", { length: 32 }).notNull(),
  emergencyRequestId: int("emergencyRequestId").notNull(),
  status: mysqlEnum("status", [
    "preparing",
    "active",
    "closing",
    "closed",
  ]).default("preparing"),
  ambulanceLat: float("ambulanceLat"),
  ambulanceLng: float("ambulanceLng"),
  progressPct: int("progressPct").default(0),
  estimatedTimeSavedMin: int("estimatedTimeSavedMin").default(0),
  signalsPrepared: int("signalsPrepared").default(0),
  totalSignals: int("totalSignals").default(0),
  activatedAt: datetime("activatedAt").default(new Date()),
  closedAt: datetime("closedAt"),
});

export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 32 }),
  createdByUserId: int("createdByUserId"),
  type: mysqlEnum("type", ["public", "emergency"]).default("public"),
  fromLat: float("fromLat").notNull(),
  fromLng: float("fromLng").notNull(),
  toLat: float("toLat").notNull(),
  toLng: float("toLng").notNull(),
  distanceKm: float("distanceKm"),
  etaSec: int("etaSec"),
  trafficLevel: mysqlEnum("trafficLevel", ["low", "moderate", "heavy", "severe"]),
  score: int("score"),
  selected: boolean("selected").default(false),
  reason: text("reason"),
  waypointsJson: json("waypointsJson"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "emergency_corridor",
    "route_update",
    "traffic_alert",
    "hospital_update",
    "police_update",
    "verification",
    "incident_update",
    "general",
  ]).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message").notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "urgent"]).default("info"),
  read: boolean("read").default(false),
  referenceId: varchar("referenceId", { length: 64 }),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export const savedRoutes = mysqlTable("savedRoutes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }),
  fromLat: float("fromLat").notNull(),
  fromLng: float("fromLng").notNull(),
  toLat: float("toLat").notNull(),
  toLng: float("toLng").notNull(),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId"),
  actorRole: varchar("actorRole", { length: 32 }),
  action: varchar("action", { length: 200 }).notNull(),
  targetType: varchar("targetType", { length: 64 }),
  targetId: varchar("targetId", { length: 64 }),
  details: text("details"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull(),
  settingValue: text("settingValue"),
  category: varchar("category", { length: 64 }),
  updatedAt: datetime("updatedAt").default(new Date()).notNull(),
});

// ---------- Activity & history tables ----------

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  activityId: varchar("activityId", { length: 32 }).notNull().unique(),
  userId: int("userId"),
  userRole: varchar("userRole", { length: 32 }),
  userName: varchar("userName", { length: 200 }),
  userEmail: varchar("userEmail", { length: 320 }),
  actionType: varchar("actionType", { length: 128 }).notNull(),
  actionDescription: text("actionDescription").notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: varchar("entityId", { length: 64 }),
  status: varchar("status", { length: 64 }).default("SUCCESS"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  deviceType: varchar("deviceType", { length: 64 }),
  location: varchar("location", { length: 200 }),
  metadata: text("metadata"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;

export const ambulanceDocuments = mysqlTable("ambulance_documents", {
  id: int("id").autoincrement().primaryKey(),
  ambulanceId: int("ambulanceId"),
  entityType: mysqlEnum("entityType", ["AMBULANCE", "HOSPITAL", "POLICE", "USER"]).default("AMBULANCE").notNull(),
  entityId: varchar("entityId", { length: 64 }),
  docType: mysqlEnum("docType", [
    "rc",
    "ambulance_permit",
    "driver_license",
    "insurance",
    "hospital_authorization",
    "hospital_license",
    "hospital_registration",
    "police_id_card",
    "police_authorization",
  ]).notNull(),
  fileName: varchar("fileName", { length: 300 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  sizeBytes: int("sizeBytes"),
  storageKey: varchar("storageKey", { length: 300 }),
  url: text("url"),
  status: mysqlEnum("status", ["pending_review", "verified", "rejected"]).default("pending_review"),
  note: text("note"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
  updatedAt: datetime("updatedAt").default(new Date()).notNull(),
});

export type AmbulanceDocument = typeof ambulanceDocuments.$inferSelect;

// ---------- Password-based authentication (email/password signup) ----------
// Session management is still the platform JWT cookie; this table stores the
// password credential + a stable openId so the existing authenticateRequest
// pipeline resolves the user from a password login exactly like OAuth.

export const userPasswords = mysqlTable("user_passwords", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  // Synthetic openId that the JWT/session layer treats like any other login.
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
  updatedAt: datetime("updatedAt").default(new Date()).notNull(),
});

export type UserPassword = typeof userPasswords.$inferSelect;

export const signalEvents = mysqlTable("signal_events", {
  id: int("id").autoincrement().primaryKey(),
  signalId: int("signalId").notNull(),
  corridorId: int("corridorId"),
  requestId: varchar("requestId", { length: 32 }),
  phase: varchar("phase", { length: 64 }).notNull(),
  previousPhase: varchar("previousPhase", { length: 64 }),
  normalDurationSec: int("normalDurationSec").default(60),
  optimizedDurationSec: int("optimizedDurationSec"),
  reason: varchar("reason", { length: 200 }),
  corridorEvent: boolean("corridorEvent").default(false),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export type SignalEvent = typeof signalEvents.$inferSelect;
