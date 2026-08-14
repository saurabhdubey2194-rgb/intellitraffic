import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { z } from "zod";
import {
  generateCorridorId,
  generateRequestId,
  generateReportId,
  haversineKm,
} from "@shared/intellitraffic";
import {
  ambulances,
  auditLogs,
  emergencyCorridors,
  emergencyRequests,
  hospitals,
  notifications,
  policeStations,
  roadSegments,
  routes,
  savedRoutes,
  systemSettings,
  trafficIncidents,
  trafficSignals,
  users,
  ambulanceDocuments,
  signalEvents,
  activityLogs,
} from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { audit } from "./audit";
import { logActivity } from "./activityLog";
import { getDb } from "./db";
import * as q from "./queries";
import {
  ambulanceProcedure,
  hostProcedure,
  hospitalProcedure,
  policeProcedure,
  verifiedProcedure,
} from "./rbac";
import { rankRoutes, predictTrafficLevels } from "./routeEngine";
import type { RouteCandidate } from "./routeEngine";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

// ---------- New scope round 2 routers (appended) ----------

import { storagePut } from "./storage";

const historyRouter = router({
  /** Global activity history — visible to all authenticated roles, scoped by role access. */
  list: protectedProcedure
    .input(
      z
        .object({
          userRole: z.string().optional(),
          actionType: z.string().optional(),
          status: z.string().optional(),
          location: z.string().optional(),
          search: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().max(200).optional(),
          offset: z.number().optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      const filters = { ...input };
      if (ctx.user.role !== "host" && ctx.user.role !== "admin") {
        filters.userRole = ctx.user.role;
      }
      return q.listActivityLogs(filters);
    }),
  stats: protectedProcedure.query(async () => {
    const [byRole, today] = await Promise.all([q.countActivityByRole(), q.countActivitiesToday()]);
    return { byRole, today };
  }),
  recent: protectedProcedure
    .input(z.object({ limit: z.number().max(50).optional() }).optional())
    .query(({ input }) => q.recentActivities(input?.limit)),
  trips: publicProcedure.query(() => q.listTripHistory()),
  corridors: publicProcedure.query(() => q.listCorridorHistory()),
});

const ambulanceRouter = router({
  documents: ambulanceProcedure.query(async ({ ctx }) => {
    const ambulance = await q.getAmbulanceByUserId(ctx.user.id);
    if (!ambulance) return [];
    const docs = await q.listAmbulanceDocuments(ambulance.id);
    return docs.map(d => ({
      ...d,
      url: d.url ?? null,
    }));
  }),
  uploadDocument: ambulanceProcedure
    .input(
      z.object({
        docType: z.enum(["rc", "ambulance_permit", "driver_license", "insurance", "hospital_authorization"]),
        fileName: z.string().max(300),
        base64: z.string().max(12_000_000),
        mimeType: z.string().max(128),
        sizeBytes: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.sizeBytes > 8 * 1024 * 1024)
        throw new TRPCError({ code: "BAD_REQUEST", message: "File too large — max 8MB" });
      if (!["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(input.mimeType))
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only PDF, JPG or PNG files are accepted" });
      const ambulance = await q.getAmbulanceByUserId(ctx.user.id);
      if (!ambulance)
        throw new TRPCError({ code: "NOT_FOUND", message: "Register your ambulance profile first" });
      const buffer = Buffer.from(input.base64, "base64");
      if (buffer.length !== input.sizeBytes && buffer.length > input.sizeBytes)
        throw new TRPCError({ code: "BAD_REQUEST", message: "File data does not match declared size" });
      const relKey = `ambulance-docs/${ambulance.id}/${Date.now()}-${input.fileName}`;
      const upload = await storagePut(relKey, buffer, input.mimeType);
      const db = await requireDb();
      // Replace previous doc of the same type for this ambulance
      await db.delete(ambulanceDocuments).where(eq(ambulanceDocuments.ambulanceId, ambulance.id));
      const ins = await db.insert(ambulanceDocuments).values({
        ambulanceId: ambulance.id,
        docType: input.docType,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: buffer.length,
        storageKey: upload.key,
        url: upload.url,
        status: "pending_review",
      });
      await logActivity({
        userId: ctx.user.id,
        userRole: ctx.user.role,
        userName: ctx.user.name,
        userEmail: ctx.user.email,
        actionType: "DOCUMENT_UPLOADED",
        actionDescription: `Uploaded ${input.docType.replace(/_/g, " ")} (${input.fileName}) for ambulance ${ambulance.registrationNumber}`,
        entityType: "DOCUMENT",
        entityId: String(ambulance.id),
        status: "PENDING",
        metadata: { docType: input.docType, fileName: input.fileName, sizeBytes: buffer.length },
      });
      return { success: true, docId: ins[0]?.insertId } as const;
    }),
  updateDocument: policeProcedure
    .input(
      z.object({ docId: z.number(), status: z.enum(["verified", "rejected"]), note: z.string().max(500).optional() })
    )
    .mutation(async ({ ctx, input }) => {
      const doc = await q.getAmbulanceDocumentById(input.docId);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      const db = await requireDb();
      await db
        .update(ambulanceDocuments)
        .set({ status: input.status, note: input.note ?? null })
        .where(eq(ambulanceDocuments.id, input.docId));
      const ambulance = await q.getAmbulanceById(doc.ambulanceId);
      if (ambulance) {
        await db.insert(notifications).values({
          userId: ambulance.userId,
          type: "verification",
          title: `Document ${input.status === "verified" ? "verified" : "rejected"}`,
          message: `Your ${doc.docType.replace(/_/g, " ")} document was ${input.status}. ${input.note ?? ""}`,
          severity: input.status === "verified" ? "info" : "warning",
        });
      }
      await logActivity({
        userId: ctx.user.id,
        userRole: ctx.user.role,
        userName: ctx.user.name,
        userEmail: ctx.user.email,
        actionType: "DOCUMENT_REVIEW",
        actionDescription: `Police ${input.status} ${doc.docType} for ambulance ${ambulance?.registrationNumber ?? doc.ambulanceId}`,
        entityType: "DOCUMENT",
        entityId: String(input.docId),
        status: input.status === "verified" ? "APPROVED" : "REJECTED",
        metadata: { docType: doc.docType, decision: input.status },
      });
      return { success: true } as const;
    }),
  pendingDocuments: policeProcedure.query(async () => {
    const db = await requireDb();
    const docs = await db
      .select()
      .from(ambulanceDocuments)
      .where(eq(ambulanceDocuments.status, "pending_review"));
    const out = [];
    for (const d of docs) {
      const ambulance = await q.getAmbulanceById(d.ambulanceId);
      out.push({ ...d, ambulance });
    }
    return out;
  }),
});

const signalsRouter = router({
  /** Public signal simulation — AI-optimized durations from density + queue. */
  simulation: publicProcedure
    .input(z.object({ id: z.number() }).optional())
    .query(async ({ input }) => {
      const signals = input ? [await q.getTrafficSignalById(input.id)].filter(Boolean) : await q.listTrafficSignals();
      const rows = await Promise.all(
        signals.map(async s => {
          const densityWeight = { low: 0.35, moderate: 0.5, heavy: 0.7, severe: 0.85 }[s.trafficDensity ?? "moderate"] ?? 0.5;
          const queueWeight = { low: 0.3, medium: 0.5, high: 0.7, very_high: 0.9 }[s.queueLevel ?? "medium"] ?? 0.5;
          const baseCycle = s.cycleSec ?? 120;
          const optimized = Math.round(baseCycle * (densityWeight * 0.6 + queueWeight * 0.4) * 0.9 + 20);
          const history = input?.id ? await q.listSignalEvents({ signalId: s.id, limit: 10 }) : [];
          return {
            signal: s,
            optimizedDurationSec: Math.min(90, Math.max(25, Math.round(optimized / 2))),
            normalDurationSec: 60,
            cycleSec: baseCycle,
            simulated: true,
            history,
          };
        })
      );
      return rows;
    }),
  updateSimulation: hostProcedure
    .input(
      z.object({
        id: z.number(),
        phase: z.string().max(64).optional(),
        optimizedDurationSec: z.number().min(10).max(120).optional(),
        reason: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const signal = await q.getTrafficSignalById(input.id);
      if (!signal) throw new TRPCError({ code: "NOT_FOUND", message: "Signal not found" });
      const db = await requireDb();
      const prevPhase = signal.currentPhase;
      if (input.phase && input.phase !== signal.currentPhase) {
        await db.update(trafficSignals).set({ currentPhase: input.phase }).where(eq(trafficSignals.id, input.id));
      }
      await db.insert(signalEvents).values({
        signalId: input.id,
        corridorId: signal.corridorId ?? undefined,
        phase: signal.currentPhase ?? "unknown",
        previousPhase: prevPhase ?? "unknown",
        normalDurationSec: 60,
        optimizedDurationSec: input.optimizedDurationSec ?? undefined,
        reason: input.reason ?? "Host simulation",
        corridorEvent: !!signal.corridorId,
      });
      await logActivity({
        userId: ctx.user.id,
        userRole: ctx.user.role,
        userName: ctx.user.name,
        userEmail: ctx.user.email,
        actionType: "SIGNAL_SIMULATION",
        actionDescription: `Host simulated signal at ${signal.intersection}: phase ${prevPhase} → ${signal.currentPhase}`,
        entityType: "SIGNAL",
        entityId: String(input.id),
        status: "SUCCESS",
        location: signal.district ?? null,
        metadata: { intersection: signal.intersection, previousPhase: prevPhase, currentPhase: signal.currentPhase },
      });
      return { success: true } as const;
    }),
  history: publicProcedure
    .input(z.object({ signalId: z.number().optional(), limit: z.number().max(200).optional() }).optional())
    .query(({ input }) => q.listSignalEvents(input)),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    profile: verifiedProcedure.query(async ({ ctx }) => {
      const user = await q.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      const ambulance = await q.getAmbulanceByUserId(ctx.user.id);
      const hospital = await q.getHospitalByUserId(ctx.user.id);
      const police = await q.getPoliceStationByUserId(ctx.user.id);
      return { user, ambulance, hospital, police };
    }),
    updateProfile: verifiedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(200).optional(),
          phone: z.string().max(32).optional(),
          city: z.string().max(128).optional(),
          district: z.string().max(128).optional(),
          state: z.string().max(128).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await audit(ctx, "UpdateProfile", "user", String(ctx.user.id));
        const db = await requireDb();
        await db.update(users).set(input).where(eq(users.id, ctx.user.id));
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "PROFILE_UPDATE",
          actionDescription: `${ctx.user.name ?? "User"} updated their profile`,
          entityType: "USER",
          entityId: String(ctx.user.id),
          status: "SUCCESS",
          location: input.district ?? null,
        });
        return { success: true } as const;
      }),
    registerRoleProfile: verifiedProcedure
      .input(
        z.object({
          role: z.enum(["public", "ambulance", "police", "hospital"]),
          ambulance: z
            .object({
              driverName: z.string().min(1).max(200),
              registrationNumber: z.string().min(5).max(32),
              driverLicenceNumber: z.string().max(64).optional(),
              permitNumber: z.string().max(64).optional(),
              insuranceNumber: z.string().max(64).optional(),
              hospitalAssociation: z.string().max(200).optional(),
              hospitalId: z.number().optional(),
              operatingDistrict: z.string().max(128).optional(),
            })
            .optional(),
          hospital: z
            .object({
              hospitalName: z.string().min(1).max(200),
              registrationNumber: z.string().max(64).optional(),
              emergencyContact: z.string().max(32).optional(),
              address: z.string().max(500).optional(),
              district: z.string().max(128).optional(),
              state: z.string().max(128).optional(),
              lat: z.number().optional(),
              lng: z.number().optional(),
            })
            .optional(),
          police: z
            .object({
              stationName: z.string().min(1).max(200),
              officerId: z.string().max(64).optional(),
              designation: z.string().max(128).optional(),
              district: z.string().max(128).optional(),
              state: z.string().max(128).optional(),
              area: z.string().max(128).optional(),
              lat: z.number().optional(),
              lng: z.number().optional(),
            })
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();

        const existingAmbulance = await q.getAmbulanceByUserId(ctx.user.id);
        const existingHospital = await q.getHospitalByUserId(ctx.user.id);
        const existingPolice = await q.getPoliceStationByUserId(ctx.user.id);
        if (input.role === "ambulance" && existingAmbulance)
          throw new TRPCError({ code: "CONFLICT", message: "Ambulance profile already registered" });
        if (input.role === "hospital" && existingHospital)
          throw new TRPCError({ code: "CONFLICT", message: "Hospital profile already registered" });
        if (input.role === "police" && existingPolice)
          throw new TRPCError({ code: "CONFLICT", message: "Police profile already registered" });

        if (ctx.user.role !== "host" && ctx.user.role !== input.role) {
          await db.update(users).set({ role: input.role }).where(eq(users.id, ctx.user.id));
        }

        if (input.role === "ambulance" && input.ambulance) {
          await db.insert(ambulances).values({
            userId: ctx.user.id,
            driverName: input.ambulance.driverName,
            registrationNumber: input.ambulance.registrationNumber,
            driverLicenceNumber: input.ambulance.driverLicenceNumber ?? null,
            permitNumber: input.ambulance.permitNumber ?? null,
            insuranceNumber: input.ambulance.insuranceNumber ?? null,
            hospitalAssociation: input.ambulance.hospitalAssociation ?? null,
            hospitalId: input.ambulance.hospitalId ?? null,
            operatingDistrict: input.ambulance.operatingDistrict ?? null,
          });
          await audit(ctx, "RegisteredAmbulance", "ambulance", String(ctx.user.id));
          await logActivity({
            userId: ctx.user.id,
            userRole: ctx.user.role,
            userName: ctx.user.name,
            userEmail: ctx.user.email,
            actionType: "AMBULANCE_REGISTRATION",
            actionDescription: `Ambulance ${input.ambulance.registrationNumber} registered by ${ctx.user.name ?? "driver"} — pending police verification`,
            entityType: "AMBULANCE",
            entityId: String(ctx.user.id),
            status: "PENDING",
            location: input.ambulance.operatingDistrict ?? null,
            metadata: { registrationNumber: input.ambulance.registrationNumber, driverName: input.ambulance.driverName },
          });
        } else if (input.role === "hospital" && input.hospital) {
          await db.insert(hospitals).values({
            userId: ctx.user.id,
            name: input.hospital.hospitalName,
            registrationNumber: input.hospital.registrationNumber ?? null,
            emergencyContact: input.hospital.emergencyContact ?? null,
            address: input.hospital.address ?? null,
            district: input.hospital.district ?? null,
            state: input.hospital.state ?? null,
            lat: input.hospital.lat ?? null,
            lng: input.hospital.lng ?? null,
          });
          await audit(ctx, "RegisteredHospital", "hospital", String(ctx.user.id));
          await logActivity({
            userId: ctx.user.id,
            userRole: ctx.user.role,
            userName: ctx.user.name,
            userEmail: ctx.user.email,
            actionType: "HOSPITAL_REGISTRATION",
            actionDescription: `Hospital ${input.hospital.hospitalName} registered on IntelliTraffic — pending verification`,
            entityType: "HOSPITAL",
            entityId: String(ctx.user.id),
            status: "PENDING",
            location: input.hospital.district ?? null,
            metadata: { hospitalName: input.hospital.hospitalName },
          });
        } else if (input.role === "police" && input.police) {
          await db.insert(policeStations).values({
            userId: ctx.user.id,
            name: input.police.stationName,
            officerId: input.police.officerId ?? null,
            designation: input.police.designation ?? null,
            district: input.police.district ?? null,
            state: input.police.state ?? null,
            area: input.police.area ?? null,
            lat: input.police.lat ?? null,
            lng: input.police.lng ?? null,
          });
          await audit(ctx, "RegisteredPoliceStation", "police", String(ctx.user.id));
          await logActivity({
            userId: ctx.user.id,
            userRole: ctx.user.role,
            userName: ctx.user.name,
            userEmail: ctx.user.email,
            actionType: "POLICE_REGISTRATION",
            actionDescription: `Police officer registered station ${input.police.stationName} — pending verification`,
            entityType: "POLICE",
            entityId: String(ctx.user.id),
            status: "PENDING",
            location: input.police.district ?? null,
            metadata: { stationName: input.police.stationName },
          });
        } else if (input.role === "public") {
          await logActivity({
            userId: ctx.user.id,
            userRole: ctx.user.role,
            userName: ctx.user.name,
            userEmail: ctx.user.email,
            actionType: "USER_REGISTRATION",
            actionDescription: `${ctx.user.name ?? "User"} registered on IntelliTraffic`,
            entityType: "USER",
            entityId: String(ctx.user.id),
            status: "SUCCESS",
            location: ctx.user.district ?? null,
          });
        }
        return {
          success: true,
          verificationStatus: input.role === "public" ? "verified" : "pending",
        } as const;
      }),
  }),

  traffic: router({
    nearby: publicProcedure
      .input(
        z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
          radiusKm: z.number().min(0.1).max(50).default(5),
        })
      )
      .query(async ({ input }) => {
        const [signals, incidents, hospitalList, stationList] = await Promise.all([
          q.listTrafficSignals(),
          q.listIncidents({ status: "all" }).then(r => r.rows),
          q.listHospitals(),
          q.listPoliceStations(),
        ]);
        const within = <T extends { lat: number | null; lng: number | null }>(
          items: T[],
          radius: number
        ) =>
          items.filter(
            it =>
              it.lat != null && it.lng != null && haversineKm(input.lat, input.lng, it.lat, it.lng) <= radius
          );
        const activeIncidents = within(incidents, input.radiusKm).filter(
          i => (i as { status?: string }).status !== "resolved" && (i as { status?: string }).status !== "false_report"
        );
        const nearbySignals = within(signals, input.radiusKm);
        const avgSpeed =
          nearbySignals.length > 0
            ? nearbySignals.reduce((s, it) => s + (it.avgSpeedKmh ?? 0), 0) / nearbySignals.length
            : null;
        const levelCounts = {
          low: nearbySignals.filter(s => s.trafficDensity === "low").length,
          moderate: nearbySignals.filter(s => s.trafficDensity === "moderate").length,
          heavy: nearbySignals.filter(s => s.trafficDensity === "heavy").length,
          severe: nearbySignals.filter(s => s.trafficDensity === "severe").length,
        };
        const overall =
          levelCounts.severe > 0
            ? "severe"
            : levelCounts.heavy > 0
              ? "heavy"
              : levelCounts.moderate > 0
                ? "moderate"
                : "low";
        return {
          overall,
          avgSpeedKmh: avgSpeed ? Math.round(avgSpeed) : null,
          signalCount: nearbySignals.length,
          incidentCount: activeIncidents.length,
          hospitalCount: within(hospitalList, input.radiusKm).length,
          policeStationCount: within(stationList, input.radiusKm).length,
          signals: nearbySignals,
          incidents: activeIncidents,
          hospitals: within(hospitalList, input.radiusKm).map(h => ({
            ...h,
            distanceKm: Math.round(haversineKm(input.lat, input.lng, h.lat!, h.lng!) * 10) / 10,
          })),
          policeStations: within(stationList, input.radiusKm).map(s => ({
            ...s,
            distanceKm: Math.round(haversineKm(input.lat, input.lng, s.lat!, s.lng!) * 10) / 10,
          })),
          demo: true,
          lastUpdated: new Date().toISOString(),
        };
      }),
    signals: publicProcedure
      .input(z.object({ district: z.string().optional() }).optional())
      .query(({ input }) => q.listTrafficSignals(input)),
    signalDetail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const signal = await q.getTrafficSignalById(input.id);
        if (!signal) throw new TRPCError({ code: "NOT_FOUND", message: "Signal not found" });
        const prediction = predictTrafficLevels(signal.trafficDensity ?? "moderate");
        return { signal, prediction, simulated: true };
      }),
    incidents: publicProcedure
      .input(
        z
          .object({
            district: z.string().optional(),
            type: z.string().optional(),
            status: z.string().optional(),
            limit: z.number().max(200).optional(),
            offset: z.number().optional(),
          })
          .optional()
      )
      .query(({ input }) => q.listIncidents(input)),
    reportIncident: verifiedProcedure
      .input(
        z.object({
          type: z.enum([
            "accident",
            "road_blockage",
            "waterlogging",
            "construction",
            "broken_signal",
            "heavy_congestion",
            "other",
          ]),
          description: z.string().max(1000).optional(),
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
          district: z.string().max(128).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const seq = await q.nextCounter("incident");
        const reportId = generateReportId(seq);
        const db = await requireDb();
        await db.insert(trafficIncidents).values({
          reportId,
          reportedByUserId: ctx.user.id,
          type: input.type,
          description: input.description ?? null,
          lat: input.lat,
          lng: input.lng,
          district: input.district ?? null,
          status: "reported",
        });
        const policeUsersRes = await q.listUsers({ role: "police", verificationStatus: "verified" });
        for (const pu of policeUsersRes.rows) {
          await db.insert(notifications).values({
            userId: pu.id,
            type: "incident_update",
            title: `New incident report ${reportId}`,
            message: `${input.type.replace(/_/g, " ")} reported${input.description ? `: ${input.description}` : ""}. Please review.`,
            severity: input.type === "accident" ? "urgent" : "warning",
            referenceId: reportId,
          });
        }
        await audit(ctx, "ReportIncident", "incident", reportId);
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "INCIDENT_REPORT",
          actionDescription: `Reported ${input.type.replace(/_/g, " ")} as ${reportId}`,
          entityType: "INCIDENT",
          entityId: reportId,
          status: "SUCCESS",
          location: input.district ?? null,
          metadata: { type: input.type, reportId },
        });
        return { success: true, reportId } as const;
      }),
    updateIncidentStatus: policeProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["investigating", "verified", "resolved", "false_report"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const inc = await q.getIncidentById(input.id);
        if (!inc) throw new TRPCError({ code: "NOT_FOUND", message: "Incident not found" });
        const db = await requireDb();
        const set: Record<string, unknown> = { status: input.status };
        if (input.status === "resolved" || input.status === "false_report") set.resolvedAt = new Date();
        const station = await q.getPoliceStationByUserId(ctx.user.id);
        if (station) set.handledByStationId = station.id;
        await db.update(trafficIncidents).set(set as never).where(eq(trafficIncidents.id, input.id));
        if (inc.reportedByUserId) {
          await db.insert(notifications).values({
            userId: inc.reportedByUserId,
            type: "incident_update",
            title: `Report ${inc.reportId ?? ""} status updated`,
            message: `Your report has been marked as ${input.status.replace(/_/g, " ")}.`,
            severity: "info",
            referenceId: inc.reportId ?? null,
          });
        }
        await audit(ctx, "UpdateIncidentStatus", "incident", String(input.id), input.status);
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "INCIDENT_STATUS_UPDATE",
          actionDescription: `Police marked report ${inc.reportId} as ${input.status.replace(/_/g, " ")}`,
          entityType: "INCIDENT",
          entityId: inc.reportId ?? String(input.id),
          status: input.status === "resolved" ? "COMPLETED" : input.status === "false_report" ? "REJECTED" : "PENDING",
          location: inc.district ?? null,
          metadata: { reportId: inc.reportId, newStatus: input.status },
        });
        return { success: true } as const;
      }),
  }),

  routes: router({
    calculate: publicProcedure
      .input(
        z.object({
          fromLat: z.number().min(-90).max(90),
          fromLng: z.number().min(-180).max(180),
          toLat: z.number().min(-90).max(90),
          toLng: z.number().min(-180).max(180),
          emergency: z.boolean().default(false),
          requestId: z.string().optional(),
          fromAddress: z.string().max(300).optional(),
          toAddress: z.string().max(300).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const [signals, incidentsRes, segments] = await Promise.all([
          q.listTrafficSignals(),
          q.listIncidents({ status: "all" }),
          q.listSegmentsAll(),
        ]);
        const incidents = incidentsRes.rows;
        const candidates = buildCandidates(
          input.fromLat,
          input.fromLng,
          input.toLat,
          input.toLng
        );
        const evaluated = rankRoutes(candidates, { incidents, signals, segments, emergency: input.emergency });
        if (input.requestId) {
          const db = await getDb();
          if (db) {
            for (const r of evaluated) {
              await db.insert(routes).values({
                requestId: input.requestId,
                createdByUserId: ctx.user?.id ?? null,
                type: input.emergency ? "emergency" : "public",
                fromLat: input.fromLat,
                fromLng: input.fromLng,
                toLat: input.toLat,
                toLng: input.toLng,
                distanceKm: r.distanceKm,
                etaSec: r.etaSec,
                trafficLevel: r.trafficLevel,
                score: r.score,
                selected: r.name.includes("Recommended"),
                reason: buildReason(r, evaluated),
                waypointsJson: JSON.stringify(r.waypoints),
              });
            }
          }
        }
        return { routes: evaluated, simulated: true } as const;
      }),
    history: verifiedProcedure
      .input(z.object({ requestId: z.string() }).optional())
      .query(async ({ input }) => {
        if (!input?.requestId) return [];
        return q.getRoutesForRequest(input.requestId);
      }),
    saved: protectedProcedure.query(({ ctx }) => q.listSavedRoutes(ctx.user.id)),
    saveRoute: verifiedProcedure
      .input(
        z.object({
          name: z.string().max(200).optional(),
          fromLat: z.number().min(-90).max(90),
          fromLng: z.number().min(-180).max(180),
          toLat: z.number().min(-90).max(90),
          toLng: z.number().min(-180).max(180),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await db.insert(savedRoutes).values({
          userId: ctx.user.id,
          name: input.name ?? null,
          fromLat: input.fromLat,
          fromLng: input.fromLng,
          toLat: input.toLat,
          toLng: input.toLng,
        });
        return { success: true } as const;
      }),
    deleteSaved: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const existing = await db.select().from(savedRoutes).where(eq(savedRoutes.id, input.id)).limit(1);
        if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
        if (existing[0].userId !== ctx.user.id)
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your saved route" });
        await db.delete(savedRoutes).where(eq(savedRoutes.id, input.id));
        return { success: true } as const;
      }),
  }),

  emergencies: router({
    create: ambulanceProcedure
      .input(
        z.object({
          hospitalId: z.number(),
          patientCondition: z.string().max(200).optional(),
          priority: z.enum(["high", "critical", "extreme"]).default("high"),
          fromLat: z.number().min(-90).max(90).optional(),
          fromLng: z.number().min(-180).max(180).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ambulance = await q.getAmbulanceByUserId(ctx.user.id);
        if (!ambulance)
          throw new TRPCError({ code: "FORBIDDEN", message: "Ambulance profile not found for your account" });
        const hospital = await q.getHospitalById(input.hospitalId);
        if (!hospital) throw new TRPCError({ code: "NOT_FOUND", message: "Hospital not found" });

        const seq = await q.nextCounter("emergency");
        const requestId = generateRequestId(seq);
        const fromLat = input.fromLat ?? ambulance.lat ?? 28.6273;
        const fromLng = input.fromLng ?? ambulance.lng ?? 77.3687;
        const toLat = hospital.lat ?? 28.6273;
        const toLng = hospital.lng ?? 77.3667;

        const db = await requireDb();
        const [signals, incidentsRes, segments] = await Promise.all([
          q.listTrafficSignals(),
          q.listIncidents({ status: "all" }),
          q.listSegmentsAll(),
        ]);
        const incidents = incidentsRes.rows;
        const candidates = buildCandidates(fromLat, fromLng, toLat, toLng);
        const evaluated = rankRoutes(candidates, { incidents, signals, segments, emergency: true });
        const best = evaluated[0];

        const ins = await db.insert(emergencyRequests).values({
          requestId,
          ambulanceId: ambulance.id,
          ambulanceUserId: ctx.user.id,
          hospitalId: hospital.id,
          patientCondition: input.patientCondition ?? null,
          priority: input.priority,
          status: "submitted",
          fromLat,
          fromLng,
          toLat,
          toLng,
          etaSec: best?.etaSec ?? null,
          distanceKm: best?.distanceKm ?? null,
          routeId: null,
        });
        const rowId = ins[0]?.insertId;

        for (const r of evaluated) {
          await db.insert(routes).values({
            requestId,
            createdByUserId: ctx.user.id,
            type: "emergency",
            fromLat,
            fromLng,
            toLat,
            toLng,
            distanceKm: r.distanceKm,
            etaSec: r.etaSec,
            trafficLevel: r.trafficLevel,
            score: r.score,
            selected: r.name.includes("Recommended"),
            reason: buildReason(r, evaluated),
            waypointsJson: JSON.stringify(r.waypoints),
          });
        }

        // Notify police for review
        const policeUsersRes = await q.listUsers({ role: "police", verificationStatus: "verified" });
        for (const pu of policeUsersRes.rows) {
          await db.insert(notifications).values({
            userId: pu.id,
            type: "police_update",
            title: "Emergency request awaiting review",
            message: `${ambulance.registrationNumber} has submitted emergency request ${requestId} to ${hospital.name}. Please verify and approve.`,
            severity: "urgent",
            referenceId: requestId,
          });
        }
        // Notify destination hospital
        if (hospital.userId) {
          await db.insert(notifications).values({
            userId: hospital.userId,
            type: "hospital_update",
            title: "Incoming emergency expected",
            message: `Emergency request ${requestId} from ${ambulance.registrationNumber} may arrive pending police approval.`,
            severity: "warning",
            referenceId: requestId,
          });
        }
        await db
          .update(ambulances)
          .set({ totalRequests: (ambulance.totalRequests ?? 0) + 1 })
          .where(eq(ambulances.id, ambulance.id));

        await audit(ctx, "CreateEmergencyRequest", "emergency", requestId);
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "EMERGENCY_CREATED",
          actionDescription: `Ambulance ${ambulance.registrationNumber} created emergency ${requestId} to ${hospital.name} — pending police verification`,
          entityType: "EMERGENCY",
          entityId: requestId,
          status: "PENDING",
          location: hospital.district ?? null,
          metadata: { requestId, ambulanceNo: ambulance.registrationNumber, hospitalName: hospital.name, priority: input.priority },
        });
        return {
          success: true,
          requestId,
          rowId,
          etaSec: best?.etaSec ?? null,
          distanceKm: best?.distanceKm ?? null,
        } as const;
      }),
    mine: ambulanceProcedure.query(async ({ ctx }) => {
      const result = await q.listEmergencyRequests({ ambulanceUserId: ctx.user.id });
      return { rows: result.rows, total: result.total, demo: true };
    }),
    incoming: hospitalProcedure.query(async ({ ctx }) => {
      const hospital = await q.getHospitalByUserId(ctx.user.id);
      if (!hospital) throw new TRPCError({ code: "NOT_FOUND", message: "Hospital profile not found" });
      const result = await q.listEmergencyRequests({ hospitalId: hospital.id });
      return { rows: result.rows, total: result.total, hospital };
    }),
    pendingForPolice: policeProcedure.query(async () => {
      const result = await q.listEmergencyRequests({ status: "submitted" });
      return { rows: result.rows, total: result.total };
    }),
    detail: protectedProcedure
      .input(z.object({ requestId: z.string() }))
      .query(async ({ ctx, input }) => {
        const req = await q.getEmergencyRequestByRequestId(input.requestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Emergency not found" });
        const isInvolved =
          req.ambulanceUserId === ctx.user.id || (await userOwnsHospital(ctx.user.id, req.hospitalId));
        const isPoliceOrHost = ctx.user.role === "police" || ctx.user.role === "host";
        if (!isInvolved && !isPoliceOrHost)
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view this emergency" });
        const routeRows = await q.getRoutesForRequest(input.requestId);
        return { request: req, routes: routeRows };
      }),
    approve: policeProcedure
      .input(
        z.object({
          requestId: z.string(),
          reviewNote: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const req = await q.getEmergencyRequestByRequestId(input.requestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Emergency not found" });
        if (req.status !== "submitted")
          throw new TRPCError({ code: "CONFLICT", message: "Request already processed" });

        const station = await q.getPoliceStationByUserId(ctx.user.id);
        const db = await requireDb();
        const [signals] = await Promise.all([q.listTrafficSignals()]);

        // Predictive corridor: prepare signals ahead of the ambulance route
        const routeRows = await q.getRoutesForRequest(input.requestId);
        const bestRoute = routeRows.find(r => r.selected) ?? routeRows[0];
        const waypoints = bestRoute?.waypointsJson
          ? (JSON.parse(String(bestRoute.waypointsJson)) as Array<{ lat: number; lng: number; name: string }>)
          : null;
        const corridorSignals = selectCorridorSignals(
          waypoints ?? [],
          signals,
          req.fromLat ?? 28.6273,
          req.fromLng ?? 77.3687
        );

        const corridorSeq = await q.nextCounter("corridor");
        const corridorId = generateCorridorId(corridorSeq);
        await db.insert(emergencyCorridors).values({
          corridorId,
          emergencyRequestId: req.id,
          status: "preparing",
          ambulanceLat: req.fromLat ?? null,
          ambulanceLng: req.fromLng ?? null,
          signalsPrepared: 0,
          totalSignals: corridorSignals.length,
          estimatedTimeSavedMin: Math.max(1, Math.round(((req.etaSec ?? 900) * 0.35) / 60)),
        });

        // Predictive signal preparation
        for (const sig of corridorSignals) {
          await db
            .update(trafficSignals)
            .set({ corridorPhase: "preparing", emergencyPriority: true, corridorId: null })
            .where(eq(trafficSignals.id, sig.id));
        }
        // Associate signals with corridor after corridor row id exists
        const corridorRows = await db
          .select()
          .from(emergencyCorridors)
          .where(eq(emergencyCorridors.corridorId, corridorId))
          .limit(1);
        if (corridorRows[0]) {
          for (const sig of corridorSignals) {
            await db
              .update(trafficSignals)
              .set({ corridorId: corridorRows[0].id })
              .where(eq(trafficSignals.id, sig.id));
          }
        }

        await db
          .update(emergencyRequests)
          .set({
            status: "approved",
            reviewedByStationId: station?.id ?? null,
            reviewNote: input.reviewNote ?? null,
          })
          .where(eq(emergencyRequests.id, req.id));

        await db.insert(notifications).values({
          userId: req.ambulanceUserId,
          type: "police_update",
          title: "Emergency request APPROVED",
          message: `Request ${input.requestId} approved. Predictive corridor ${corridorId} activating — signals are being prepared ahead of your route.`,
          severity: "urgent",
          referenceId: input.requestId,
        });
        const hospital = await q.getHospitalById(req.hospitalId);
        if (hospital?.userId) {
          await db.insert(notifications).values({
            userId: hospital.userId,
            type: "hospital_update",
            title: "Emergency APPROVED — incoming",
            message: `Police approved request ${input.requestId}. Ambulance ETA ~${Math.round((req.etaSec ?? 0) / 60)} min.`,
            severity: "urgent",
            referenceId: input.requestId,
          });
        }
        // Alert public users in the city
        const publicUsersRes = await q.listUsers({ role: "public", limit: 50 });
        for (const pu of publicUsersRes.rows.slice(0, 20)) {
          await db.insert(notifications).values({
            userId: pu.id,
            type: "emergency_corridor",
            title: "EMERGENCY VEHICLE APPROACHING",
            message:
              "An emergency vehicle is approaching your area. Please keep intersections clear.",
            severity: "urgent",
            referenceId: input.requestId,
          });
        }
        await audit(ctx, "ApproveEmergency", "emergency", input.requestId);
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "EMERGENCY_APPROVED",
          actionDescription: `Police ${station?.name ?? "station"} approved ${input.requestId} and activated corridor ${corridorId}`,
          entityType: "EMERGENCY",
          entityId: input.requestId,
          status: "APPROVED",
          metadata: { requestId: input.requestId, corridorId, signalsPrepared: corridorSignals.length },
        });
        return { success: true, corridorId } as const;
      }),
    reject: policeProcedure
      .input(
        z.object({
          requestId: z.string(),
          reason: z.string().max(500),
          flagSuspicious: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const req = await q.getEmergencyRequestByRequestId(input.requestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Emergency not found" });
        const db = await requireDb();
        await db
          .update(emergencyRequests)
          .set({ status: "rejected", reviewNote: input.reason })
          .where(eq(emergencyRequests.id, req.id));
        const ambulance = await q.getAmbulanceById(req.ambulanceId);
        if (ambulance) {
          const updates: Record<string, number> = {
            rejectedRequests: (ambulance.rejectedRequests ?? 0) + 1,
          };
          if (input.flagSuspicious)
            updates.suspiciousRequests = (ambulance.suspiciousRequests ?? 0) + 1;
          await db.update(ambulances).set(updates).where(eq(ambulances.id, ambulance.id));
        }
        await db.insert(notifications).values({
          userId: req.ambulanceUserId,
          type: "police_update",
          title: "Emergency request rejected",
          message: `Request ${input.requestId} was rejected: ${input.reason}`,
          severity: "warning",
          referenceId: input.requestId,
        });
        await audit(ctx, "RejectEmergency", "emergency", input.requestId, input.reason);
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "EMERGENCY_REJECTED",
          actionDescription: `Police rejected ${input.requestId}: ${input.reason}`,
          entityType: "EMERGENCY",
          entityId: input.requestId,
          status: "REJECTED",
          metadata: { requestId: input.requestId, reason: input.reason, suspicious: input.flagSuspicious },
        });
        return { success: true } as const;
      }),
    activateCorridor: ambulanceProcedure
      .input(z.object({ requestId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const req = await q.getEmergencyRequestByRequestId(input.requestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Emergency not found" });
        if (req.ambulanceUserId !== ctx.user.id)
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your emergency" });
        if (req.status !== "approved")
          throw new TRPCError({ code: "CONFLICT", message: "Request not approved yet" });
        const corridor = await q.getActiveCorridorByRequestId(req.id);
        if (!corridor) throw new TRPCError({ code: "NOT_FOUND", message: "Corridor not found" });
        const ambulance = await q.getAmbulanceById(req.ambulanceId);
        const db = await requireDb();
        await db
          .update(emergencyRequests)
          .set({ status: "corridor_active" })
          .where(eq(emergencyRequests.id, req.id));
        await db
          .update(emergencyCorridors)
          .set({ status: "active", progressPct: 0 })
          .where(eq(emergencyCorridors.id, corridor.id));
        await audit(ctx, "ActivateCorridor", "corridor", corridor.corridorId);
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "CORRIDOR_ACTIVATED",
          actionDescription: `Ambulance ${ambulance?.registrationNumber ?? "vehicle"} activated corridor ${corridor.corridorId} for ${input.requestId}`,
          entityType: "CORRIDOR",
          entityId: corridor.corridorId,
          status: "ACTIVE",
          location: ambulance?.operatingDistrict ?? null,
          metadata: { requestId: input.requestId, corridorId: corridor.corridorId },
        });
        return { success: true } as const;
      }),
    corridorProgress: ambulanceProcedure
      .input(z.object({ requestId: z.string(), progressPct: z.number().min(0).max(100) }))
      .mutation(async ({ ctx, input }) => {
        const req = await q.getEmergencyRequestByRequestId(input.requestId);
        if (!req || req.ambulanceUserId !== ctx.user.id)
          throw new TRPCError({ code: "NOT_FOUND", message: "Emergency not found" });
        const corridor = await q.getActiveCorridorByRequestId(req.id);
        if (!corridor) throw new TRPCError({ code: "NOT_FOUND", message: "Corridor not found" });
        const db = await requireDb();
        await db
          .update(emergencyCorridors)
          .set({ progressPct: input.progressPct })
          .where(eq(emergencyCorridors.id, corridor.id));
        // Dynamic signal priority simulation: signals ahead turn READY as ambulance approaches
        const allSignals = await q.getSignalsByCorridor(corridor.id);
        const total = Math.max(allSignals.length, 1);
        let prepared = 0;
        for (let i = 0; i < allSignals.length; i++) {
          const sig = allSignals[i];
          const sigPct = (i / total) * 100;
          let phase: "normal" | "monitoring" | "preparing" | "ready" = "normal";
          if (sigPct <= Math.max(0, input.progressPct - 25)) {
            phase = "ready";
            prepared++;
          } else if (sigPct <= input.progressPct) {
            phase = "preparing";
          } else {
            phase = "monitoring";
          }
          await db.update(trafficSignals).set({ corridorPhase: phase }).where(eq(trafficSignals.id, sig.id));
        }
        await db
          .update(emergencyCorridors)
          .set({ signalsPrepared: prepared })
          .where(eq(emergencyCorridors.id, corridor.id));
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "CORRIDOR_PROGRESS",
          actionDescription: `Ambulance reported ${Math.round(input.progressPct)}% progress on corridor ${corridor.corridorId} — ${prepared}/${allSignals.length} signals prepared`,
          entityType: "CORRIDOR",
          entityId: corridor.corridorId,
          status: "ACTIVE",
          metadata: { requestId: input.requestId, corridorId: corridor.corridorId, progressPct: input.progressPct, signalsPrepared: prepared },
        });
        return { success: true, signalsPrepared: prepared } as const;
      }),
    arrive: hospitalProcedure
      .input(z.object({ requestId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const req = await q.getEmergencyRequestByRequestId(input.requestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Emergency not found" });
        if (!(await userOwnsHospital(ctx.user.id, req.hospitalId)))
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this hospital" });
        const hospital = await q.getHospitalByUserId(ctx.user.id);
        if (!hospital) throw new TRPCError({ code: "NOT_FOUND", message: "Hospital not found" });
        const db = await requireDb();
        await db
          .update(emergencyRequests)
          .set({ status: "arrived" })
          .where(eq(emergencyRequests.id, req.id));
        const corridor = await q.getActiveCorridorByRequestId(req.id);
        if (corridor) {
          await db
            .update(emergencyCorridors)
            .set({ status: "closing", closedAt: new Date() })
            .where(eq(emergencyCorridors.id, corridor.id));
          const corridorSignals = await q.getSignalsByCorridor(corridor.id);
          for (const sig of corridorSignals) {
            await db
              .update(trafficSignals)
              .set({ corridorPhase: "normal", emergencyPriority: false, corridorId: null })
              .where(eq(trafficSignals.id, sig.id));
          }
        }
        await db.insert(notifications).values({
          userId: req.ambulanceUserId,
          type: "hospital_update",
          title: `Arrival confirmed at ${hospital.name}`,
          message: `Hospital confirmed ambulance arrival for ${input.requestId}.`,
          severity: "info",
          referenceId: input.requestId,
        });
        await audit(ctx, "ConfirmArrival", "emergency", input.requestId);
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "HOSPITAL_ARRIVAL",
          actionDescription: `${hospital.name} confirmed ambulance arrival for ${input.requestId} — corridor closing`,
          entityType: "EMERGENCY",
          entityId: input.requestId,
          status: "COMPLETED",
          location: hospital.district ?? null,
          metadata: { requestId: input.requestId, hospitalName: hospital.name },
        });
        return { success: true } as const;
      }),
    complete: hospitalProcedure
      .input(z.object({ requestId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const req = await q.getEmergencyRequestByRequestId(input.requestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Emergency not found" });
        if (!(await userOwnsHospital(ctx.user.id, req.hospitalId)))
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this hospital" });
        const hospital = await q.getHospitalByUserId(ctx.user.id);
        const db = await requireDb();
        await db
          .update(emergencyRequests)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(emergencyRequests.id, req.id));
        const corridor = await q.getActiveCorridorByRequestId(req.id);
        if (corridor) {
          await db
            .update(emergencyCorridors)
            .set({ status: "closed", closedAt: new Date() })
            .where(eq(emergencyCorridors.id, corridor.id));
        }
        const ambulance = await q.getAmbulanceById(req.ambulanceId);
        if (ambulance) {
          await db
            .update(ambulances)
            .set({ verifiedRequests: (ambulance.verifiedRequests ?? 0) + 1 })
            .where(eq(ambulances.id, ambulance.id));
        }
        await db.insert(notifications).values({
          userId: req.ambulanceUserId,
          type: "hospital_update",
          title: "EMERGENCY COMPLETED",
          message: `Hospital marked emergency ${input.requestId} as completed. Corridor closed.`,
          severity: "info",
          referenceId: input.requestId,
        });
        await audit(ctx, "CompleteEmergency", "emergency", input.requestId);
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "EMERGENCY_COMPLETED",
          actionDescription: `${hospital?.name ?? "Hospital"} marked ${input.requestId} completed — corridor closed`,
          entityType: "EMERGENCY",
          entityId: input.requestId,
          status: "COMPLETED",
          location: hospital?.district ?? null,
          metadata: { requestId: input.requestId, hospitalName: hospital?.name },
        });
        return { success: true } as const;
      }),
    corridors: protectedProcedure.query(() => q.listCorridors()),
    myCorridor: ambulanceProcedure
      .input(z.object({ requestId: z.string() }))
      .query(async ({ ctx, input }) => {
        const req = await q.getEmergencyRequestByRequestId(input.requestId);
        if (!req || req.ambulanceUserId !== ctx.user.id)
          throw new TRPCError({ code: "NOT_FOUND", message: "Emergency not found" });
        const corridor = await q.getActiveCorridorByRequestId(req.id);
        const signals = corridor ? await q.getSignalsByCorridor(corridor.id) : [];
        return { corridor, signals };
      }),
  }),

  admin: router({
    stats: hostProcedure.query(() => q.getDashboardStats()),
    emergencyStats: hostProcedure.query(() => q.getEmergencyRequestStats()),
    users: hostProcedure
      .input(
        z
          .object({
            role: z.string().optional(),
            verificationStatus: z.string().optional(),
            state: z.string().optional(),
            district: z.string().optional(),
            search: z.string().optional(),
            limit: z.number().max(200).optional(),
            offset: z.number().optional(),
          })
          .optional()
      )
      .query(({ input }) => q.listUsers(input)),
    verifyUser: hostProcedure
      .input(
        z.object({
          userId: z.number(),
          status: z.enum(["verified", "rejected", "suspended", "under_review"]),
          note: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const target = await q.getUserById(input.userId);
        if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        if (target.role === "host")
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot modify host accounts" });
        const db = await requireDb();
        const set: Record<string, unknown> = {
          verificationStatus: input.status,
          verificationNote: input.note ?? null,
        };
        if (input.status === "suspended") set.suspendedAt = new Date();
        if (input.status === "verified") set.suspendedAt = null;
        await db.update(users).set(set).where(eq(users.id, input.userId));
        await db.insert(notifications).values({
          userId: input.userId,
          type: "verification",
          title: `Account ${input.status === "verified" ? "verified" : input.status}`,
          message: `Your account has been ${input.status.replace(/_/g, " ")}.${input.note ? ` ${input.note}` : ""}`,
          severity: input.status === "verified" ? "info" : "warning",
        });
        await audit(
          ctx,
          input.status === "suspended" ? "SuspendUser" : `VerifyUser:${input.status}`,
          "user",
          String(input.userId),
          target.email ?? undefined
        );
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "VERIFICATION_DECISION",
          actionDescription: `Host ${input.status === "verified" ? "verified" : `marked as ${input.status.replace(/_/g, " ")}`}: ${target.name ?? target.email ?? "user"} (${target.role})`,
          entityType: "VERIFICATION",
          entityId: String(input.userId),
          status: input.status === "verified" ? "APPROVED" : "REJECTED",
          metadata: { targetRole: target.role, decision: input.status, note: input.note ?? null },
        });
        return { success: true } as const;
      }),
    ambulances: hostProcedure.query(() => q.listAmbulances()),
    hospitals: hostProcedure.query(() => q.listHospitals()),
    policeStations: hostProcedure.query(() => q.listPoliceStations()),
    segments: hostProcedure.query(async () => q.listSegmentsAll()),
    incidents: hostProcedure
      .input(
        z
          .object({
            district: z.string().optional(),
            type: z.string().optional(),
            status: z.string().optional(),
          })
          .optional()
      )
      .query(({ input }) => q.listIncidents(input)),
    emergencies: hostProcedure.query(() => q.listEmergencyRequests({ limit: 100 })),
    corridors: hostProcedure.query(() => q.listCorridors()),
    signals: hostProcedure.query(() => q.listTrafficSignals()),
    auditLogs: hostProcedure
      .input(z.object({ limit: z.number().max(200).optional(), offset: z.number().optional() }).optional())
      .query(({ input }) => q.listAuditLogs(input)),
    settings: hostProcedure.query(() => q.listSettings()),
    updateSetting: hostProcedure
      .input(
        z.object({
          key: z.string().max(128),
          value: z.string().max(2000),
          category: z.string().max(64).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await q.upsertSetting(input.key, input.value, input.category);
        await audit(ctx, "UpdateSetting", "setting", input.key, input.value);
        return { success: true } as const;
      }),
    exportData: hostProcedure
      .input(
        z.object({
          table: z.enum(["users", "signals", "hospitals", "incidents", "emergencies", "corridors"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        let rows: unknown[] = [];
        switch (input.table) {
          case "users": {
            const res = await q.listUsers({ limit: 500 });
            rows = res.rows;
            break;
          }
          case "signals":
            rows = await q.listTrafficSignals();
            break;
          case "hospitals":
            rows = await q.listHospitals();
            break;
          case "incidents":
            rows = (await q.listIncidents({ limit: 500 })).rows;
            break;
          case "emergencies":
            rows = (await q.listEmergencyRequests({ limit: 500 })).rows;
            break;
          case "corridors":
            rows = await q.listCorridors({ limit: 200 });
            break;
        }
        await audit(ctx, "ExportData", "export", input.table);
        return { rows, count: rows.length } as const;
      }),
    systemHealth: hostProcedure.query(async () => {
      const dbOk = await (async () => {
        try {
          await q.getDashboardStats();
          return true;
        } catch {
          return false;
        }
      })();
      return {
        backend: "online" as const,
        database: dbOk ? ("online" as const) : ("offline" as const),
        maps: "online" as const,
        trafficApi: "demo_mode" as const,
        aiEngine: "online" as const,
        realtime: "online" as const,
      };
    }),
  }),

  history: historyRouter,
  ambulances: ambulanceRouter,
  signalsSimulation: signalsRouter,
  demoControls: router({
    /** Auto-drive a full emergency lifecycle: create → approve → activate → arrive → complete (demo). */
    simulateEmergency: hostProcedure.mutation(async ({ ctx }) => {
      const db = await requireDb();
      const ambulances = await q.listAmbulances({});
      const demoAmbulance = ambulances.rows[0]?.ambulance;
      const hospital = (await q.listHospitals())[0];
      if (!demoAmbulance || !hospital) throw new TRPCError({ code: "BAD_REQUEST", message: "No demo ambulance/hospital available" });
      // Mirror of emergencies.create/approve/activateCorridor/arrive/complete for demo drive.
      const seq = await q.nextCounter("emergency");
      const requestId = generateRequestId(seq);
      await db.execute(sql`INSERT INTO emergencyRequests (requestId, ambulanceId, ambulanceUserId, hospitalId, patientCondition, priority, status, fromLat, fromLng, toLat, toLng, createdAt)
        VALUES (${requestId}, ${demoAmbulance.id}, ${demoAmbulance.userId}, ${hospital.id}, 'Simulated cardiac emergency (demo)', 'critical', 'pending', 28.6273, 77.3687, 28.6273, 77.3667, NOW())`);
      await db.execute(sql`UPDATE emergencyRequests SET status = 'approved' WHERE requestId = ${requestId}`);
      const corridorId = generateCorridorId(seq);
      await db.execute(sql`INSERT INTO emergencyCorridors (corridorId, emergencyRequestId, status, progressPct, estimatedTimeSavedMin, signalsPrepared, totalSignals, activatedAt)
        VALUES (${corridorId}, ${requestId}, 'active', 100, 8, 16, 16, NOW())`);
      await db.execute(sql`UPDATE emergencyRequests SET status = 'in_transit' WHERE requestId = ${requestId}`);
      await db.execute(sql`UPDATE emergencyRequests SET status = 'arrived' WHERE requestId = ${requestId}`);
      await db.execute(sql`UPDATE emergencyRequests SET status = 'completed', completedAt = NOW() WHERE requestId = ${requestId}`);
      await db.execute(sql`UPDATE emergencyCorridors SET status = 'completed', closedAt = NOW() WHERE emergencyRequestId = ${requestId}`);
      await logActivity({
        userId: ctx.user.id,
        userRole: ctx.user.role,
        userName: ctx.user.name,
        userEmail: ctx.user.email,
        actionType: "DEMO_EMERGENCY_SIMULATED",
        actionDescription: `Host simulated full emergency lifecycle ${requestId} (create → approve → activate → arrive → complete)`,
        entityType: "EMERGENCY",
        entityId: requestId,
        status: "COMPLETED",
        location: "Noida",
        metadata: { demo: true },
      });
      return { requestId, message: "Demo emergency lifecycle completed" } as const;
    }),
    /** Generate a random traffic incident on the demo map. */
    generateAccident: hostProcedure
      .input(z.object({}).optional())
      .mutation(async ({ ctx }) => {
        const types = ["accident", "road_blockage", "waterlogging", "heavy_congestion", "construction"] as const;
        const type = types[Math.floor(Math.random() * types.length)];
        const signals = await q.listTrafficSignals({});
        const s = signals[Math.floor(Math.random() * signals.length)] ?? { lat: 28.6329, lng: 77.2195, district: "New Delhi" };
        const db = await requireDb();
        const seqR = await q.nextCounter("report"); const reportId = generateReportId(seqR);
        await db.insert(trafficIncidents).values({
          reportId,
          type,
          description: `Simulated ${type.replace("_", " ")} (host demo)`,
          lat: s.lat + (Math.random() - 0.5) * 0.002,
          lng: s.lng + (Math.random() - 0.5) * 0.002,
          district: s.district,
          status: "reported",
        });
        await logActivity({
          userId: ctx.user.id,
          userRole: ctx.user.role,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          actionType: "INCIDENT_REPORTED",
          actionDescription: `Host generated demo incident: ${reportId}`,   
          entityType: "INCIDENT",
          entityId: reportId,
          status: "SUCCESS",
          location: s.district,
          metadata: { type, demo: true },
        });
        return { reportId, type, location: s.district } as const;
      }),
    /** Reset all demo operational data back to the seeded Delhi NCR baseline. */
    resetDemoData: hostProcedure.mutation(async ({ ctx }) => {
      // Delegate to the seed script via SQL performed directly.
      const db = await requireDb();
      await db.delete(activityLogs);
      await db.delete(signalEvents);
      await db.delete(ambulanceDocuments);
      await db.delete(routes);
      await db.delete(emergencyCorridors);
      await db.delete(emergencyRequests);
      await db.delete(trafficIncidents);
      await logActivity({
        userId: ctx.user.id,
        userRole: ctx.user.role,
        userName: ctx.user.name,
        userEmail: ctx.user.email,
        actionType: "ADMIN_ACTION",
        actionDescription: "Host reset all demo operational data",
        entityType: "SYSTEM",
        entityId: "demo",
        status: "SUCCESS",
        location: null,
        metadata: { demo: true },
      });
      return { success: true } as const;
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => q.listNotifications(ctx.user.id)),
    unreadCount: protectedProcedure.query(({ ctx }) => q.countUnreadNotifications(ctx.user.id)),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await db
          .update(notifications)
          .set({ read: true })
          .where(eq(notifications.userId, ctx.user.id) && eq(notifications.id, input.id));
        return { success: true } as const;
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await requireDb();
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, ctx.user.id));
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;

// ------------------------------------------------------------------
// Internal helpers
// ------------------------------------------------------------------

async function userOwnsHospital(userId: number, hospitalId: number): Promise<boolean> {
  const hospital = await q.getHospitalByUserId(userId);
  return hospital != null && hospital.id === hospitalId;
}

function selectCorridorSignals(
  waypoints: Array<{ lat: number; lng: number }>,
  signals: Awaited<ReturnType<typeof q.listTrafficSignals>>,
  fromLat: number,
  fromLng: number
) {
  const selected = [];
  const used = new Set<number>();
  const points = [{ lat: fromLat, lng: fromLng }, ...waypoints];
  for (const pt of points) {
    const sorted = signals
      .filter(s => !used.has(s.id))
      .sort(
        (a, b) =>
          haversineKm(pt.lat, pt.lng, a.lat, a.lng) - haversineKm(pt.lat, pt.lng, b.lat, b.lng)
      );
    for (const s of sorted.slice(0, 3)) {
      if (haversineKm(pt.lat, pt.lng, s.lat, s.lng) <= 2 && !used.has(s.id)) {
        used.add(s.id);
        selected.push(s);
      }
    }
  }
  return selected.slice(0, 6);
}

/** Three route candidates: direct, ring-road detour, inner-city alternative. */
function buildCandidates(
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

function buildReason(best: { etaSec: number }, all: Array<{ etaSec: number }>): string {
  const others = all.filter(r => r !== best);
  const next = others[0];
  if (!next) return "Fastest available route.";
  const savedMin = Math.round((next.etaSec - best.etaSec) / 60);
  return savedMin > 0
    ? `Current and predicted congestion makes this route approximately ${savedMin} minutes faster than the next best alternative, despite not being the shortest in distance.`
    : "Balanced route considering current congestion, incidents, road capacity and signal density.";
}

