import {
  boolean,
  datetime,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table for FakeShield AI.
 * Supports standard users, investigators, and admins.
 */
export const users = mysqlTable(
  "fs_users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "investigator", "admin"]).default("user").notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "pending",
      "verified",
      "rejected",
      "suspended",
    ]).default("pending").notNull(),
    createdAt: datetime("createdAt").default(new Date()).notNull(),
    updatedAt: datetime("updatedAt").default(new Date()).notNull(),
    lastSignedIn: datetime("lastSignedIn").default(new Date()).notNull(),
  }
);

export type User = typeof users.$inferSelect;

/**
 * Stores hashed passwords for users who register via email/password.
 */
export const userPasswords = mysqlTable("fs_user_passwords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
  updatedAt: datetime("updatedAt").default(new Date()).notNull(),
});

/**
 * Media files uploaded for analysis.
 */
export const mediaFiles = mysqlTable("fs_media_files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  originalName: varchar("originalName", { length: 300 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  size: int("size").notNull(),
  storageKey: varchar("storageKey", { length: 300 }).notNull(),
  url: text("url").notNull(),
  sha256Hash: varchar("sha256Hash", { length: 64 }),
  type: mysqlEnum("type", ["image", "video", "audio", "text"]).notNull(),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export type MediaFile = typeof mediaFiles.$inferSelect;

/**
 * Analysis jobs representing the processing pipeline.
 */
export const analysisJobs = mysqlTable("fs_analysis_jobs", {
  id: int("id").autoincrement().primaryKey(),
  mediaId: int("mediaId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", [
    "queued",
    "preprocessing",
    "analyzing",
    "generating_report",
    "completed",
    "failed",
  ]).default("queued").notNull(),
  progress: int("progress").default(0),
  errorMessage: text("errorMessage"),
  startedAt: datetime("startedAt"),
  completedAt: datetime("completedAt"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export type AnalysisJob = typeof analysisJobs.$inferSelect;

/**
 * Results generated from an analysis job.
 */
export const analysisResults = mysqlTable("fs_analysis_results", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  mediaId: int("mediaId").notNull(),
  authenticityScore: float("authenticityScore").notNull(), // 0 to 100
  manipulationProbability: float("manipulationProbability").notNull(), // 0 to 100
  riskLevel: mysqlEnum("riskLevel", ["low", "moderate", "high", "critical"]).notNull(),
  confidence: float("confidence").notNull(), // 0 to 100
  modelVersion: varchar("modelVersion", { length: 64 }),
  summary: text("summary"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

export type AnalysisResult = typeof analysisResults.$inferSelect;

/**
 * Specific signals/anomalies detected during analysis.
 */
export const analysisSignals = mysqlTable("fs_analysis_signals", {
  id: int("id").autoincrement().primaryKey(),
  resultId: int("resultId").notNull(),
  type: varchar("type", { length: 128 }).notNull(), // e.g., "Face Swapping", "Voice Synthesis"
  score: float("score").notNull(),
  description: text("description"),
  evidenceLocation: text("evidenceLocation"), // e.g., timestamp or coordinates
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

/**
 * Professional case management for investigators.
 */
export const cases = mysqlTable("fs_cases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["open", "closed", "archived"]).default("open").notNull(),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
  updatedAt: datetime("updatedAt").default(new Date()).notNull(),
});

/**
 * Links media files to cases.
 */
export const caseEvidence = mysqlTable("fs_case_evidence", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  mediaId: int("mediaId").notNull(),
  notes: text("notes"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

/**
 * Real-time notifications for users.
 */
export const notifications = mysqlTable("fs_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "error"]).default("info").notNull(),
  read: boolean("read").default(false).notNull(),
  link: text("link"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

/**
 * External threat intelligence indicators.
 */
export const threatIndicators = mysqlTable("fs_threat_indicators", {
  id: int("id").autoincrement().primaryKey(),
  mediaId: int("mediaId").notNull(),
  source: varchar("source", { length: 128 }).notNull(), // e.g., "VirusTotal", "Google Safe Browsing"
  indicatorType: varchar("indicatorType", { length: 128 }).notNull(), // e.g., "malicious_url", "known_deepfake_hash"
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  details: text("details"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

/**
 * API usage tracking for admin monitoring.
 */
export const apiUsage = mysqlTable("fs_api_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: int("statusCode"),
  responseTime: int("responseTime"), // in ms
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

/**
 * System audit logs for security and compliance.
 */
export const auditLogs = mysqlTable("fs_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 200 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }),
  resourceId: varchar("resourceId", { length: 64 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  metadata: text("metadata"),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});

/**
 * Abuse reports for incorrect analysis results.
 */
export const abuseReports = mysqlTable("fs_abuse_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resultId: int("resultId").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pending", "reviewed", "resolved"]).default("pending").notNull(),
  createdAt: datetime("createdAt").default(new Date()).notNull(),
});
