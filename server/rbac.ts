import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";

type FakeShieldRole = "user" | "investigator" | "admin";

const FAKESHIELD_ROLES: FakeShieldRole[] = [
  "user",
  "investigator",
  "admin",
];

function requireRole(...roles: FakeShieldRole[]) {
  return protectedProcedure.use(async opts => {
    const { ctx, next } = opts;
    const user = ctx.user;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });
    }
    if (user.role === "admin") {
      // Admin bypasses all role gates
      return next({ ctx: { ...ctx, user } });
    }
    if (!roles.includes(user.role as FakeShieldRole)) {
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
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });
    }
    const verified =
      user.role === "admin" ||
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

export const investigatorProcedure = requireRole("investigator");
export const adminProcedure = requireRole("admin");
export const verifiedProcedure = requireVerification();

export function requireAdmin(ctx: TrpcContext) {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin authorization required",
    });
  }
}

export { FAKESHIELD_ROLES, router, protectedProcedure, publicProcedure };
