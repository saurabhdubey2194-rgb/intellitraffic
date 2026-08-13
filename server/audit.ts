import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";

export async function audit(
  ctx: TrpcContext,
  action: string,
  targetType: string,
  targetId: string,
  details?: string
) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      actorUserId: ctx.user?.id ?? null,
      actorRole: ctx.user?.role ?? null,
      action,
      targetType,
      targetId,
      details: details ?? null,
    });
  } catch (err) {
    console.warn("[Audit] Failed to write audit log:", err);
  }
}
