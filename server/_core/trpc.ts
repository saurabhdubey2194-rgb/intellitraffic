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

  const start = Date.now();
  const result = await next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
  const duration = Date.now() - start;

  // Track API usage in background
  try {
    const db = await requireDb();
    const { apiUsage } = await import("../../drizzle/schema");
    await db.insert(apiUsage).values({
      userId: ctx.user.id,
      endpoint: path,
      method: type,
      statusCode: (result as any).ok ? 200 : 500,
      responseTime: duration,
      ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress,
    });
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
