import { router } from "./_core/trpc";
import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import {
  ambulanceProcedure,
  hostProcedure,
  policeProcedure,
  verifiedProcedure,
} from "./rbac";
import { buildCandidates } from "./testHelpers";
import { evaluateRoute, rankRoutes, predictTrafficLevels } from "./routeEngine";
import type { RouteCandidate } from "./routeEngine";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: string): TrpcContext {
  return {
    user: {
      id: 42,
      openId: `user-${role}`,
      email: `${role}@example.com`,
      name: `Test ${role}`,
      loginMethod: "manus",
      role: role as AuthenticatedUser["role"],
      verificationStatus: role === "host" ? undefined : "verified",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as AuthenticatedUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function makeCaller(proc: ReturnType<typeof ambulanceProcedure>, role: string) {
  return router({ check: proc.query(() => "ok") }).createCaller(createCtx(role));
}

describe("RBAC role gates", () => {
  it("ambulanceProcedure blocks non-ambulance roles", async () => {
    await expect(makeCaller(ambulanceProcedure, "public").check()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("ambulanceProcedure allows ambulance role", async () => {
    await expect(makeCaller(ambulanceProcedure, "ambulance").check()).resolves.toBe("ok");
  });

  it("policeProcedure blocks ambulance role", async () => {
    await expect(makeCaller(policeProcedure, "ambulance").check()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("host bypasses all role gates", async () => {
    await expect(makeCaller(ambulanceProcedure, "host").check()).resolves.toBe("ok");
    await expect(makeCaller(policeProcedure, "host").check()).resolves.toBe("ok");
    await expect(makeCaller(hostProcedure, "host").check()).resolves.toBe("ok");
  });

  it("unauthenticated requests are rejected", async () => {
    const caller = router({ check: verifiedProcedure.query(() => "ok") }).createCaller({
      user: null,
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext);
    await expect(caller.check()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("ambulance dashboard endpoint is gated by role", async () => {
    const caller = appRouter.createCaller(createCtx("public"));
    await expect(caller.emergencies.mine()).rejects.toMatchObject({ code: "FORBIDDEN" });
    const ambulanceCaller = appRouter.createCaller(createCtx("ambulance"));
    // Will return empty list since no ambulance profile registered for the test user.
    let result: { rows: unknown[] } | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await ambulanceCaller.emergencies.mine();
        break;
      } catch (e) {
        lastErr = e;
        await new Promise(r => setTimeout(r, 4000)); // retry on transient DB timeouts
      }
    }
    if (!result) throw lastErr;
    // mine() returns { rows: [], total, demo }
    expect(result.demo).toBe(true);
    expect(Array.isArray(result.rows)).toBe(true);
    expect(result.rows.length).toBe(0);
    expect(result.total).toBe(0);
  }, 60000);

  it("admin procedures are gated for non-host", async () => {
    const caller = appRouter.createCaller(createCtx("police"));
    await expect(caller.admin.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  }, 20000);
});

describe("routeEngine", () => {
  const candidate: RouteCandidate = {
    name: "Route A",
    waypoints: [
      { lat: 26.5123, lng: 80.2331, name: "Start" },
      { lat: 26.5, lng: 80.3, name: "Mid" },
      { lat: 26.4769, lng: 80.3001, name: "Destination" },
    ],
    baseSpeedKmh: 32,
    signalCount: 0,
    historicalCongestionFactor: 1.15,
  };

  it("evaluates routes with all five required inputs", () => {
    const ctx = {
      incidents: [
        { id: 1, lat: 26.5, lng: 80.3, status: "reported", type: "accident" },
      ],
      signals: [{ id: 1, lat: 26.499, lng: 80.301 }],
      segments: [
        { id: 1, fromLat: 26.49, fromLng: 80.29, toLat: 26.51, toLng: 80.31, currentLoad: 70, capacity: 100 },
      ],
      emergency: false,
    };
    const result = evaluateRoute(candidate, ctx as never);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown.congestion).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.incidents).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.capacity).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.historical).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.signalDensity).toBeGreaterThanOrEqual(0);
  });

  it("ranks routes and names the best route Recommended", () => {
    const ctx = { incidents: [], signals: [], segments: [], emergency: false };
    const ranked = rankRoutes(buildCandidates(26.5123, 80.2331, 26.4769, 80.3001), ctx as never);
    expect(ranked.length).toBe(3);
    expect(ranked[0]?.name).toBe("Route A — Recommended");
    expect(ranked[0]?.etaSec).toBeGreaterThan(0);
    expect(ranked[0]?.distanceKm).toBeGreaterThan(0);
  });

  it("emergency mode speeds up routes", () => {
    const ctx = { incidents: [], signals: [], segments: [], emergency: false };
    const em = rankRoutes(buildCandidates(26.5123, 80.2331, 26.4769, 80.3001), { ...ctx, emergency: true } as never);
    const normal = rankRoutes(buildCandidates(26.5123, 80.2331, 26.4769, 80.3001), ctx as never);
    expect(em[0]?.etaSec).toBeLessThan(normal[0]?.etaSec);
  });

  it("predictTrafficLevels degrades over time", () => {
    const levels = predictTrafficLevels("moderate");
    expect(levels[0]?.level).toBe("heavy");
    expect(levels.length).toBe(3);
  });
});

describe("emergency workflow authorization", () => {
  it("create requires ambulance role", async () => {
    const caller = appRouter.createCaller(createCtx("public"));
    await expect(
      caller.emergencies.create({ hospitalId: 1, priority: "high" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  }, 15000);

  it("approve requires police role", async () => {
    const caller = appRouter.createCaller(createCtx("ambulance"));
    await expect(
      caller.emergencies.approve({ requestId: "IT-KNP-2026-000001" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  }, 15000);

  it("hospital endpoints require hospital role", async () => {
    const caller = appRouter.createCaller(createCtx("police"));
    await expect(caller.emergencies.incoming()).rejects.toMatchObject({ code: "FORBIDDEN" });
  }, 15000);
});

describe("incident reporting", () => {
  it("reportIncident requires a valid account (unauthenticated rejected)", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext);
    await expect(
      caller.traffic.reportIncident({
        type: "accident",
        lat: 26.5,
        lng: 80.3,
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  }, 15000);

  it("public role is verified instantly and can report incidents", async () => {
    // Public users activate instantly; the gate passes, DB write follows.
    const caller = appRouter.createCaller(createCtx("public"));
    const result = await caller.traffic.reportIncident({
      type: "accident",
      lat: 26.5,
      lng: 80.3,
    });
    expect(result.success).toBe(true);
    expect(result.reportId).toMatch(/^IT-DLH-2026-/);
  }, 20000);
});
