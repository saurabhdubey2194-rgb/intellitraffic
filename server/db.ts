import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { User, users, userPasswords, mediaFiles, analysisJobs, analysisResults, analysisSignals, cases, auditLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: Partial<User> & { openId: string }): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: any = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };

    if (user.role) {
      values.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        lastSignedIn: values.lastSignedIn,
        role: values.role,
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserPassword(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userPasswords).where(eq(userPasswords.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Media & Analysis Helpers
export async function createMediaFile(media: typeof mediaFiles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(mediaFiles).values(media);
}

export async function createAnalysisJob(job: typeof analysisJobs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(analysisJobs).values(job);
}

export async function getAnalysisJob(jobId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAnalysisJob(jobId: number, data: Partial<typeof analysisJobs.$inferSelect>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(analysisJobs).set({ ...data, updatedAt: undefined } as any).where(eq(analysisJobs.id, jobId));
}
