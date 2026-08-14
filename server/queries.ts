import {
  and,
  desc,
  eq,
  gte,
  inArray,
  like,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "./db";
import {
  ambulances,
  auditLogs,
  emergencyCorridors,
  emergencyRequests,
  hospitals,
  notifications,
  policeStations,
  routes,
  savedRoutes,
  systemSettings,
  trafficIncidents,
  trafficSignals,
  users,
} from "../drizzle/schema";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

// ---------- Users ----------
export async function listUsers(filters?: {
  role?: string;
  verificationStatus?: string;
  state?: string;
  district?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await requireDb();
  const conditions = [];
  if (filters?.role && filters.role !== "all")
    conditions.push(eq(users.role, filters.role as typeof users.role.enumValues[number]));
  if (filters?.verificationStatus && filters.verificationStatus !== "all")
    conditions.push(eq(users.verificationStatus, filters.verificationStatus as typeof users.verificationStatus.enumValues[number]));
  if (filters?.state) conditions.push(eq(users.state, filters.state));
  if (filters?.district) conditions.push(eq(users.district, filters.district));
  if (filters?.search)
    conditions.push(
      or(like(users.name, `%${filters.search}%`), like(users.email, `%${filters.search}%`))!
    );
  const rows = await db
    .select()
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined);
  return { rows, total: Number(count) };
}

export async function getUserById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return res[0];
}

// ---------- Ambulances ----------
export async function listAmbulances(opts?: {
  userId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await requireDb();
  const conditions = [];
  if (opts?.userId) conditions.push(eq(ambulances.userId, opts.userId));
  if (opts?.status) {
    conditions.push(eq(users.verificationStatus, opts.status as typeof users.verificationStatus.enumValues[number]));
  }
  const rows = await db
    .select({ user: users, ambulance: ambulances })
    .from(users)
    .innerJoin(ambulances, eq(users.id, ambulances.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .innerJoin(ambulances, eq(users.id, ambulances.userId))
    .where(conditions.length ? and(...conditions) : undefined);
  return { rows, total: Number(count) };
}

export async function getAmbulanceByUserId(userId: number) {
  const db = await requireDb();
  const res = await db
    .select()
    .from(ambulances)
    .where(eq(ambulances.userId, userId))
    .limit(1);
  return res[0];
}

export async function getAmbulanceById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(ambulances).where(eq(ambulances.id, id)).limit(1);
  return res[0];
}

// ---------- Hospitals ----------
export async function listHospitals(opts?: { district?: string; limit?: number }) {
  const db = await requireDb();
  const conditions = [];
  if (opts?.district) conditions.push(eq(hospitals.district, opts.district));
  return db
    .select()
    .from(hospitals)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(opts?.limit ?? 50);
}

export async function getHospitalById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(hospitals).where(eq(hospitals.id, id)).limit(1);
  return res[0];
}

export async function getHospitalByUserId(userId: number) {
  const db = await requireDb();
  const res = await db.select().from(hospitals).where(eq(hospitals.userId, userId)).limit(1);
  return res[0];
}

// ---------- Police stations ----------
export async function listPoliceStations(opts?: { district?: string }) {
  const db = await requireDb();
  const conditions = [];
  if (opts?.district) conditions.push(eq(policeStations.district, opts.district));
  return db
    .select()
    .from(policeStations)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(50);
}

export async function getPoliceStationById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(policeStations).where(eq(policeStations.id, id)).limit(1);
  return res[0];
}

export async function getPoliceStationByUserId(userId: number) {
  const db = await requireDb();
  const res = await db.select().from(policeStations).where(eq(policeStations.userId, userId)).limit(1);
  return res[0];
}

// ---------- Traffic signals ----------
export async function listTrafficSignals(opts?: { district?: string }) {
  const db = await requireDb();
  const conditions = [];
  if (opts?.district) conditions.push(eq(trafficSignals.district, opts.district));
  return db.select().from(trafficSignals).where(conditions.length ? and(...conditions) : undefined).limit(300);
}

export async function getTrafficSignalById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(trafficSignals).where(eq(trafficSignals.id, id)).limit(1);
  return res[0];
}

export async function getSignalsByCorridor(corridorId: number) {
  const db = await requireDb();
  return db.select().from(trafficSignals).where(eq(trafficSignals.corridorId, corridorId));
}

// ---------- Road segments ----------
export async function listSegmentsAll() {
  const db = await requireDb();
  const roadSegments = await import("../drizzle/schema").then(m => m.roadSegments);
  return db.select().from(roadSegments).limit(300);
}

// ---------- Incidents ----------
export async function listIncidents(opts?: {
  district?: string;
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await requireDb();
  const conditions = [];
  if (opts?.district) conditions.push(eq(trafficIncidents.district, opts.district));
  if (opts?.type && opts.type !== "all")
    conditions.push(eq(trafficIncidents.type, opts.type as typeof trafficIncidents.type.enumValues[number]));
  if (opts?.status && opts.status !== "all")
    conditions.push(eq(trafficIncidents.status, opts.status as typeof trafficIncidents.status.enumValues[number]));
  const rows = await db
    .select()
    .from(trafficIncidents)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(trafficIncidents.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(trafficIncidents)
    .where(conditions.length ? and(...conditions) : undefined);
  return { rows, total: Number(count) };
}

export async function getIncidentById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(trafficIncidents).where(eq(trafficIncidents.id, id)).limit(1);
  return res[0];
}

export async function getIncidentByReportId(reportId: string) {
  const db = await requireDb();
  const res = await db.select().from(trafficIncidents).where(eq(trafficIncidents.reportId, reportId)).limit(1);
  return res[0];
}

// ---------- Emergency requests ----------
export async function listEmergencyRequests(opts?: {
  ambulanceUserId?: number;
  hospitalId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await requireDb();
  const conditions = [];
  if (opts?.ambulanceUserId)
    conditions.push(eq(emergencyRequests.ambulanceUserId, opts.ambulanceUserId));
  if (opts?.hospitalId) conditions.push(eq(emergencyRequests.hospitalId, opts.hospitalId));
  if (opts?.status && opts.status !== "all")
    conditions.push(eq(emergencyRequests.status, opts.status as typeof emergencyRequests.status.enumValues[number]));
  const rows = await db
    .select()
    .from(emergencyRequests)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(emergencyRequests.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(emergencyRequests)
    .where(conditions.length ? and(...conditions) : undefined);
  return { rows, total: Number(count) };
}

export async function getEmergencyRequestById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(emergencyRequests).where(eq(emergencyRequests.id, id)).limit(1);
  return res[0];
}

export async function getEmergencyRequestByRequestId(requestId: string) {
  const db = await requireDb();
  const res = await db.select().from(emergencyRequests).where(eq(emergencyRequests.requestId, requestId)).limit(1);
  return res[0];
}

// ---------- Corridors ----------
export async function listCorridors(opts?: { status?: string; limit?: number }) {
  const db = await requireDb();
  const conditions = [];
  if (opts?.status && opts.status !== "all")
    conditions.push(eq(emergencyCorridors.status, opts.status as typeof emergencyCorridors.status.enumValues[number]));
  return db
    .select()
    .from(emergencyCorridors)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(emergencyCorridors.activatedAt))
    .limit(opts?.limit ?? 50);
}

export async function getCorridorById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(emergencyCorridors).where(eq(emergencyCorridors.id, id)).limit(1);
  return res[0];
}

export async function getActiveCorridorByRequestId(requestId: number) {
  const db = await requireDb();
  const res = await db
    .select()
    .from(emergencyCorridors)
    .where(
      and(
        eq(emergencyCorridors.emergencyRequestId, requestId),
        inArray(emergencyCorridors.status, ["preparing", "active"])
      )
    )
    .limit(1);
  return res[0];
}

// ---------- Routes ----------
export async function getRoutesForRequest(requestId: string) {
  const db = await requireDb();
  return db
    .select()
    .from(routes)
    .where(eq(routes.requestId, requestId))
    .orderBy(desc(routes.score));
}

export async function getRouteById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(routes).where(eq(routes.id, id)).limit(1);
  return res[0];
}

export async function listSavedRoutes(userId: number) {
  const db = await requireDb();
  return db.select().from(savedRoutes).where(eq(savedRoutes.userId, userId)).orderBy(desc(savedRoutes.createdAt)).limit(50);
}

// ---------- Notifications ----------
export async function listNotifications(userId: number, opts?: { limit?: number }) {
  const db = await requireDb();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(opts?.limit ?? 40);
}

export async function countUnreadNotifications(userId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
    .limit(100);
  return rows.length;
}

// ---------- Audit logs ----------
export async function listAuditLogs(opts?: { limit?: number; offset?: number }) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  return { rows, total: Number(count) };
}

// ---------- Settings ----------
export async function getSetting(key: string): Promise<string | null> {
  const db = await requireDb();
  const res = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key)).limit(1);
  return res[0]?.settingValue ?? null;
}

export async function listSettings(category?: string) {
  const db = await requireDb();
  const conditions = [];
  if (category) conditions.push(eq(systemSettings.category, category));
  return db.select().from(systemSettings).where(conditions.length ? and(...conditions) : undefined);
}

export async function upsertSetting(key: string, value: string, category?: string) {
  const db = await requireDb();
  await db
    .insert(systemSettings)
    .values({ settingKey: key, settingValue: value, category: category ?? null, updatedAt: new Date() })
    .onDuplicateKeyUpdate({ set: { settingValue: value, updatedAt: new Date() } });
}

// ---------- Counters for ID generation ----------
export async function nextCounter(category: string): Promise<number> {
  const current = await getSetting(`counter:${category}`);
  const next = (current ? parseInt(current, 10) : 0) + 1;
  await upsertSetting(`counter:${category}`, String(next), "counters");
  return next;
}

// ---------- Stats ----------
export async function getDashboardStats() {
  const db = await requireDb();
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [publicCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "public"));
  const [ambulanceCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.role, "ambulance"), eq(users.verificationStatus, "verified")));
  const [policeCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "police"));
  const [hospitalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "hospital"));
  const [activeEmergency] = await db
    .select({ count: sql<number>`count(*)` })
    .from(emergencyRequests)
    .where(
      inArray(emergencyRequests.status, ["approved", "corridor_active", "in_transit"])
    );
  const [activeCorridors] = await db
    .select({ count: sql<number>`count(*)` })
    .from(emergencyCorridors)
    .where(inArray(emergencyCorridors.status, ["preparing", "active"]));
  const [incidents] = await db
    .select({ count: sql<number>`count(*)` })
    .from(trafficIncidents)
    .where(inArray(trafficIncidents.status, ["reported", "investigating", "verified"]));
  const [pendingVerification] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(
      inArray(users.verificationStatus, ["pending", "under_review"])
    );
  return {
    totalUsers: Number(userCount.count),
    publicUsers: Number(publicCount.count),
    verifiedAmbulances: Number(ambulanceCount.count),
    policeStations: Number(policeCount.count),
    hospitals: Number(hospitalCount.count),
    activeEmergencies: Number(activeEmergency.count),
    activeCorridors: Number(activeCorridors.count),
    trafficIncidents: Number(incidents.count),
    pendingVerifications: Number(pendingVerification.count),
  };
}

export async function getEmergencyRequestStats() {
  const db = await requireDb();
  const rows = await db
    .select({ status: emergencyRequests.status, count: sql<number>`count(*)` })
    .from(emergencyRequests)
    .groupBy(emergencyRequests.status);
  const stats: Record<string, number> = {};
  for (const row of rows) {
    if (row.status) stats[row.status] = Number(row.count);
  }
  return stats;
}

export async function getAmbulanceTrustStats(ambulanceId: number) {
  const a = await getAmbulanceById(ambulanceId);
  if (!a) return null;
  const total = a.totalRequests || 1;
  const trust = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((a.verifiedRequests || 0) / total) * 100 -
          (a.suspiciousRequests || 0) * 10 -
          (a.rejectedRequests || 0) * 5
      )
    )
  );
  return { ...a, trustScore: trust };
}

// ---------- Traffic prediction (simulated) ----------
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

// ---------- Date range ----------
export async function listUsersInDateRange(start?: Date, end?: Date) {
  const db = await requireDb();
  const conditions = [];
  if (start) conditions.push(gte(users.createdAt, start));
  if (end) conditions.push(lte(users.createdAt, end));
  const rows = await db
    .select({ createdAt: users.createdAt, role: users.role })
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined);
  return rows;
}

export async function listRequestsInDateRange(start?: Date, end?: Date) {
  const db = await requireDb();
  const conditions = [];
  if (start) conditions.push(gte(emergencyRequests.createdAt, start));
  if (end) conditions.push(lte(emergencyRequests.createdAt, end));
  const rows = await db
    .select({
      createdAt: emergencyRequests.createdAt,
      status: emergencyRequests.status,
      distanceKm: emergencyRequests.distanceKm,
      etaSec: emergencyRequests.etaSec,
      suspicious: emergencyRequests.suspicious,
    })
    .from(emergencyRequests)
    .where(conditions.length ? and(...conditions) : undefined);
  return rows;
}

export async function listIncidentsInDateRange(start?: Date, end?: Date) {
  const db = await requireDb();
  const conditions = [];
  if (start) conditions.push(gte(trafficIncidents.createdAt, start));
  if (end) conditions.push(lte(trafficIncidents.createdAt, end));
  const rows = await db
    .select({ createdAt: trafficIncidents.createdAt, type: trafficIncidents.type })
    .from(trafficIncidents)
    .where(conditions.length ? and(...conditions) : undefined);
  return rows;
}

// ---------- Activity logs / history ----------
import {
  activityLogs,
  ambulanceDocuments,
  signalEvents,
} from "../drizzle/schema";

export async function listActivityLogs(filters?: {
  userRole?: string;
  actionType?: string;
  status?: string;
  location?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await requireDb();
  const conditions = [];
  if (filters?.userRole && filters.userRole !== "all")
    conditions.push(eq(activityLogs.userRole, filters.userRole));
  if (filters?.actionType && filters.actionType !== "all")
    conditions.push(eq(activityLogs.actionType, filters.actionType));
  if (filters?.status && filters.status !== "all")
    conditions.push(eq(activityLogs.status, filters.status));
  if (filters?.location) conditions.push(eq(activityLogs.location, filters.location));
  if (filters?.startDate) conditions.push(gte(activityLogs.createdAt, filters.startDate));
  if (filters?.endDate) conditions.push(lte(activityLogs.createdAt, filters.endDate));
  if (filters?.search) {
    conditions.push(
      or(
        like(activityLogs.userName, `%${filters.search}%`),
        like(activityLogs.userEmail, `%${filters.search}%`),
        like(activityLogs.activityId, `%${filters.search}%`),
        like(activityLogs.entityId, `%${filters.search}%`),
        like(activityLogs.actionDescription, `%${filters.search}%`)
      )!
    );
  }
  const rows = await db
    .select()
    .from(activityLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(activityLogs.createdAt))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activityLogs)
    .where(conditions.length ? and(...conditions) : undefined);
  return { rows, total: Number(count) };
}

export async function countActivityByRole() {
  const db = await requireDb();
  const rows = await db
    .select({ userRole: activityLogs.userRole, count: sql<number>`count(*)` })
    .from(activityLogs)
    .groupBy(activityLogs.userRole);
  return rows;
}

export async function countActivitiesToday() {
  const db = await requireDb();
  const start = new Date(new Date().setUTCHours(0, 0, 0, 0));
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activityLogs)
    .where(gte(activityLogs.createdAt, start));
  return Number(count);
}

export async function recentActivities(limit = 5) {
  const db = await requireDb();
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// ---------- Emergency history (trip history) ----------
export async function listTripHistory() {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(emergencyRequests)
    .where(or(eq(emergencyRequests.status, "completed"), eq(emergencyRequests.status, "arrived"), eq(emergencyRequests.status, "in_transit")))
    .orderBy(desc(emergencyRequests.createdAt))
    .limit(200);
  return rows;
}

export async function listCorridorHistory() {
  const db = await requireDb();
  return db.select().from(emergencyCorridors).orderBy(desc(emergencyCorridors.activatedAt)).limit(200);
}

export async function listSignalEvents(filters?: { signalId?: number; limit?: number }) {
  const db = await requireDb();
  const conditions = [];
  if (filters?.signalId) conditions.push(eq(signalEvents.signalId, filters.signalId));
  return db
    .select()
    .from(signalEvents)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(signalEvents.createdAt))
    .limit(filters?.limit ?? 100);
}

// ---------- Ambulance documents ----------
export async function listAmbulanceDocuments(ambulanceId: number) {
  const db = await requireDb();
  return db.select().from(ambulanceDocuments).where(eq(ambulanceDocuments.ambulanceId, ambulanceId));
}

export async function getAmbulanceDocumentById(id: number) {
  const db = await requireDb();
  const res = await db.select().from(ambulanceDocuments).where(eq(ambulanceDocuments.id, id)).limit(1);
  return res[0];
}

// ---------- Verified ambulances (for police verification queue) ----------
export async function listPendingAmbulances() {
  const db = await requireDb();
  return db.select().from(ambulances).orderBy(desc(ambulances.createdAt)).limit(200);
}
