import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
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
} from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { audit } from "./audit";
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
        const fromLat = input.fromLat ?? ambulance.lat ?? 26.5123;
        const fromLng = input.fromLng ?? ambulance.lng ?? 80.2331;
        const toLat = hospital.lat ?? 26.4769;
        const toLng = hospital.lng ?? 80.3001;

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
          req.fromLat ?? 26.5123,
          req.fromLng ?? 80.2331
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
        return { success: true } as const;
      }),
    complete: hospitalProcedure
      .input(z.object({ requestId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const req = await q.getEmergencyRequestByRequestId(input.requestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Emergency not found" });
        if (!(await userOwnsHospital(ctx.user.id, req.hospitalId)))
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this hospital" });
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
