import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import {
  users,
  userPasswords,
  mediaFiles,
  analysisJobs,
  analysisResults,
  analysisSignals,
  cases,
  caseEvidence,
  auditLogs,
  abuseReports,
} from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { SignJWT } from "jose";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as q from "./queries";
import { storagePut } from "./storage";
import { processJob } from "./worker";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

/**
 * RBAC Middlewares
 */
const investigatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "investigator" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Investigator access required" });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

/**
 * Authentication & Profile Router
 */
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  signUp: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }

      const openId = `fs_${Math.random().toString(36).slice(2, 11)}`;
      const [userResult] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        openId,
        role: "user",
        verificationStatus: "verified",
      });

      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(input.password, 10);
      await db.insert(userPasswords).values({
        userId: userResult.insertId,
        passwordHash,
      });

      const token = await new SignJWT({
        openId,
        appId: ENV.appId,
        name: input.name,
      })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime("365d")
        .sign(new TextEncoder().encode(ENV.cookieSecret));

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true };
    }),
  signInWithPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });

      const [pass] = await db.select().from(userPasswords).where(eq(userPasswords.userId, user.id)).limit(1);
      if (!pass) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });

      const bcrypt = await import("bcryptjs");
      const valid = await bcrypt.compare(input.password, pass.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });

      const token = await new SignJWT({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || "",
      })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime("365d")
        .sign(new TextEncoder().encode(ENV.cookieSecret));

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true };
    }),
  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await q.listUsers({ search: ctx.user.email ?? undefined, limit: 1 });
    if (user.total === 0) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return user.rows[0];
  }),
  checkAvailability: publicProcedure
    .input(z.object({ email: z.string().email().optional() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      if (!input.email) return { emailAvailable: true };
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      return { emailAvailable: existing.length === 0 };
    }),
});

/**
 * Analysis & Media Router
 */
const analysisRouter = router({
  upload: protectedProcedure
    .input(z.object({
      fileName: z.string().max(300),
      mimeType: z.string().max(128),
      size: z.number(),
      base64: z.string(),
      type: z.enum(["image", "video", "audio", "text"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const storageKey = `media/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      const upload = await storagePut(storageKey, buffer, input.mimeType);
      
      const db = await requireDb();
      const [media] = await db.insert(mediaFiles).values({
        userId: ctx.user.id,
        originalName: input.fileName,
        mimeType: input.mimeType,
        size: input.size,
        storageKey: upload.key,
        url: upload.url,
        type: input.type,
      });
      
      const [job] = await db.insert(analysisJobs).values({
        mediaId: media.insertId,
        userId: ctx.user.id,
        status: "queued",
      });
      
      // Trigger background processing (fire and forget for prototype)
      processJob(job.insertId).catch(console.error);
      
      return { jobId: job.insertId, mediaId: media.insertId };
    }),
  
  jobStatus: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const [job] = await db.select({
        id: analysisJobs.id,
        status: analysisJobs.status,
        progress: analysisJobs.progress,
        createdAt: analysisJobs.createdAt,
        media: {
          originalName: mediaFiles.originalName,
          type: mediaFiles.type,
          size: mediaFiles.size,
          url: mediaFiles.url,
        }
      })
      .from(analysisJobs)
      .innerJoin(mediaFiles, eq(analysisJobs.mediaId, mediaFiles.id))
      .where(eq(analysisJobs.id, input.jobId))
      .limit(1);
      
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      return job;
    }),
    
  results: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      return q.getAnalysisResult(input.jobId);
    }),
    
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return q.listAnalysisJobs({ userId: ctx.user.id, ...input });
    }),
});

/**
 * Main App Router
 */
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  analysis: analysisRouter,
});

export type AppRouter = typeof appRouter;
