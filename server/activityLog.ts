/**
 * Activity log system for FakeShield AI.
 * Proxies to auditLogs table.
 */
import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";

export interface ActivityInput {
  userId?: number | null;
  actionType: string;
  actionDescription: string;
  entityType?: string | null;
  entityId?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
}

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(auditLogs).values({
      userId: input.userId ?? null,
      action: input.actionType,
      resourceType: input.entityType ?? null,
      resourceId: input.entityId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : input.actionDescription,
    });
  } catch (err) {
    console.error("[activityLog] failed to write", err);
  }
}
