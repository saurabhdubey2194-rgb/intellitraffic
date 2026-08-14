import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";

type IntelliTrafficRole = "public" | "ambulance" | "police" | "hospital" | "host";

const INTELLITRAFFIC_ROLES: IntelliTrafficRole[] = [
  "public",
  "ambulance",
  "police",
  "hospital",
  "host",
];

function requireRole(...roles: IntelliTrafficRole[]) {
  return protectedProcedure.use(async opts => {
    const { ctx, next } = opts;
    const user = ctx.user;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });
    }
    if (user.role === "host" || user.role === "admin") {
      // Host/admin bypasses all role gates (full platform authority)
      return next({ ctx: { ...ctx, user } });
    }
    if (!roles.includes(user.role as IntelliTrafficRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Access denied. This feature is restricted to: ${roles.join(", ")}`,
      });
    }
    return next({ ctx: { ...ctx, user } });
  });
}

function requireVerification() {
  return protectedProcedure.use(async opts => {
    const { ctx, next } = opts;
    const user = opts.ctx.user;
    if (!user || (user as TrpcContext["user"]) === null) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });
    }
    const verified =
      user.role === "host" ||
      user.role === "public" ||
      user.verificationStatus === "verified";
    if (!verified) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Your account is not verified. Verified accounts only can access operational features.",
      });
    }
    return next({ ctx: { ...opts.ctx, user } });
  });
}

export const roleProcedure = (roles: IntelliTrafficRole[]) => requireRole(...roles);
export const verifiedProcedure = roleProcedure(["public", "ambulance", "police", "hospital"]);
export const ambulanceProcedure = requireRole("ambulance");
export const policeProcedure = requireRole("police");
export const hospitalProcedure = requireRole("hospital");
export const hostProcedure = requireRole("host");
export const publicOrAny = protectedProcedure;

export function requireHost(ctx: TrpcContext) {
  if (!ctx.user || ctx.user.role !== "host") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Host/admin authorization required",
    });
  }
}

export { INTELLITRAFFIC_ROLES, router, protectedProcedure, publicProcedure };
