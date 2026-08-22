import {
  and,
  desc,
  eq,
  like,
  or,
  sql,
} from "drizzle-orm";
import { requireDb } from "./db";
import {
  users,
  mediaFiles,
  analysisJobs,
  analysisResults,
  analysisSignals,
  cases,
  caseEvidence,
  auditLogs,
  abuseReports,
} from "../drizzle/schema";

// ---------- Users ----------
export async function listUsers(filters?: {
  role?: string;
  verificationStatus?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await requireDb();
  const conditions = [];
  if (filters?.role && filters.role !== "all")
    conditions.push(eq(users.role, filters.role as any));
  if (filters?.verificationStatus && filters.verificationStatus !== "all")
    conditions.push(eq(users.verificationStatus, filters.verificationStatus as any));
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

// ---------- Analysis ----------
export async function listAnalysisJobs(opts?: {
  userId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await requireDb();
  const conditions = [];
  if (opts?.userId) conditions.push(eq(analysisJobs.userId, opts.userId));
  if (opts?.status && opts.status !== "all")
    conditions.push(eq(analysisJobs.status, opts.status as any));
  
  const rows = await db
    .select({ job: analysisJobs, media: mediaFiles, result: analysisResults })
    .from(analysisJobs)
    .innerJoin(mediaFiles, eq(analysisJobs.mediaId, mediaFiles.id))
    .leftJoin(analysisResults, eq(analysisJobs.id, analysisResults.jobId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(analysisJobs.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(analysisJobs)
    .where(conditions.length ? and(...conditions) : undefined);

  return { rows, total: Number(count) };
}

export async function getAnalysisResult(jobId: number) {
  const db = await requireDb();
  const result = await db.select().from(analysisResults).where(eq(analysisResults.jobId, jobId)).limit(1);
  if (result.length === 0) return null;
  
  const signals = await db.select().from(analysisSignals).where(eq(analysisSignals.resultId, result[0].id));
  return { ...result[0], signals };
}

// ---------- Cases ----------
export async function listCases(userId: number, opts?: { status?: string; limit?: number }) {
  const db = await requireDb();
  const conditions = [eq(cases.userId, userId)];
  if (opts?.status && opts.status !== "all")
    conditions.push(eq(cases.status, opts.status as any));
    
  return db
    .select()
    .from(cases)
    .where(and(...conditions))
    .orderBy(desc(cases.createdAt))
    .limit(opts?.limit ?? 50);
}

export async function getCaseDetails(caseId: number) {
  const db = await requireDb();
  const caseData = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (caseData.length === 0) return null;
  
  const evidence = await db
    .select({ evidence: caseEvidence, media: mediaFiles })
    .from(caseEvidence)
    .innerJoin(mediaFiles, eq(caseEvidence.mediaId, mediaFiles.id))
    .where(eq(caseEvidence.caseId, caseId));
    
  return { ...caseData[0], evidence };
}

// ---------- Stats ----------
export async function getSystemStats() {
  const db = await requireDb();
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [jobCount] = await db.select({ count: sql<number>`count(*)` }).from(analysisJobs);
  const [highRiskCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(analysisResults)
    .where(or(eq(analysisResults.riskLevel, "high"), eq(analysisResults.riskLevel, "critical")));
    
  return {
    totalUsers: Number(userCount.count),
    totalAnalyses: Number(jobCount.count),
    highRiskDetections: Number(highRiskCount.count),
  };
}

export async function getUserStats(userId: number) {
  const db = await requireDb();
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(analysisJobs).where(eq(analysisJobs.userId, userId));
  const [highRisk] = await db
    .select({ count: sql<number>`count(*)` })
    .from(analysisResults)
    .innerJoin(analysisJobs, eq(analysisResults.jobId, analysisJobs.id))
    .where(and(
      eq(analysisJobs.userId, userId),
      or(eq(analysisResults.riskLevel, "high"), eq(analysisResults.riskLevel, "critical"))
    ));
    
  return {
    totalAnalyses: Number(total.count),
    highRiskDetections: Number(highRisk.count),
  };
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
