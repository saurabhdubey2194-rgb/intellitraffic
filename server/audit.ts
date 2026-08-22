import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";

export async function audit(
  ctx: TrpcContext,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: string
) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      userId: ctx.user?.id ?? null,
      action,
      resourceType,
      resourceId,
      metadata: metadata ?? null,
      ipAddress: ctx.req.ip ?? null,
    });
  } catch (err) {
    console.warn("[Audit] Failed to write audit log:", err);
  }
}
