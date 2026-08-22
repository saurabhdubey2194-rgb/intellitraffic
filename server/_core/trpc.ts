import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { requireDb } from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next, path, type } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Enforce usage quotas for analysis scans
  if (path === 'analysis.startAnalysis') {
    const db = await requireDb();
    const { usageQuotas } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const [quota] = await db.select().from(usageQuotas).where(eq(usageQuotas.userId, ctx.user.id)).limit(1);
    
    if (quota && quota.currentUsage >= quota.monthlyLimit) {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: "Monthly usage quota exceeded. Please upgrade your plan." 
      });
    }
  }

  const start = Date.now();
  const result = await next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
  const duration = Date.now() - start;

  // Track API usage and increment quota
  try {
    const db = await requireDb();
    const { apiUsage, usageQuotas } = await import("../../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    
    await db.insert(apiUsage).values({
      userId: ctx.user.id,
      endpoint: path,
      method: type,
      statusCode: (result as any).ok ? 200 : 500,
      responseTime: duration,
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
    });

    if (path === 'analysis.startAnalysis' && (result as any).ok) {
      await db.update(usageQuotas)
        .set({ currentUsage: sql`${usageQuotas.currentUsage} + 1` })
        .where(eq(usageQuotas.userId, ctx.user.id));
    }
  } catch (err) {
    console.error("Failed to log API usage:", err);
  }

  return result;
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
