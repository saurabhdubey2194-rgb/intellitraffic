/**
 * Persistent activity log system for IntelliTraffic.
 * Every important platform action writes a row into `activity_logs`,
 * which powers the per-role History pages and the admin Activity Center.
 */
import { getDb } from "./db";
import { activityLogs } from "../drizzle/schema";
import { generateActivityId } from "../shared/intellitraffic";

export interface ActivityInput {
  /** Authenticated actor; optional for anonymous public actions (route search etc.). */
  userId?: number | null;
  userRole?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  actionType: string;
  actionDescription: string;
  entityType?: string | null;
  entityId?: string | null;
  status?: "SUCCESS" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "FAILED" | "ACTIVE" | "INFO";
  location?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(activityLogs).values({
      activityId: generateActivityId(),
      userId: input.userId ?? null,
      userRole: input.userRole ?? null,
      userName: input.userName ?? null,
      userEmail: input.userEmail ?? null,
      actionType: input.actionType,
      actionDescription: input.actionDescription,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      status: input.status ?? "SUCCESS",
      ipAddress: null,
      deviceType: null,
      location: input.location ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
  } catch (err) {
    // Activity logging must never break the main action — swallow and log.
    // eslint-disable-next-line no-console
    console.error("[activityLog] failed to write", err);
  }
}
