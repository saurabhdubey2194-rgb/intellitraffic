/**
 * Vitest specs for the traditional email/password sign-up flow:
 * - valid signup creates a user + hashed credential and rejects a duplicate email
 * - signInWithPassword accepts correct credentials and rejects wrong ones
 * - freshly signed-up users remain "public" (cannot self-promote role)
 */
import { describe, it, expect } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, userPasswords } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as unknown as TrpcContext["req"],
    res: { cookie: () => undefined, clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

const rand = () => Math.floor(100000000 + Math.random() * 899999999);

function buildInput(name: string) {
  return {
    name,
    email: `${name.replace(/\s+/g, ".")}-${rand()}@example.com`,
    phone: `9${rand()}`,
    password: "secure-password-8chars",
  };
}

describe("auth.signUp", () => {
  it("creates a public user, stores hashed password, and blocks duplicate email", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const caller = appRouter.createCaller(createCtx());

    const input = buildInput("vitest-signup-user");
    const res = await caller.auth.signUp(input);
    expect(res.success).toBe(true);
    expect(res.userId).toBeGreaterThan(0);

    const created = await db.select().from(users).where(eq(users.id, res.userId)).limit(1);
    expect(created.length).toBe(1);
    expect(created[0].role).toBe("public");
    expect(created[0].email).toBe(input.email);
    expect(created[0].openId).toMatch(/^pw_/);
    const cred = await db.select().from(userPasswords).where(eq(userPasswords.openId, created[0].openId)).limit(1);
    expect(cred.length).toBe(1);
    expect(cred[0].passwordHash).toMatch(/^\$2[aby]\$/);

    // Duplicate email is rejected with a friendly conflict message.
    await expect(caller.auth.signUp(input)).rejects.toThrow(/already registered/);
  }, 30000);

  it("signs in with correct password and rejects wrong password", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const caller = appRouter.createCaller(createCtx());

    const input = buildInput("vitest-signin-user");
    await caller.auth.signUp(input);

    const login = await caller.auth.signInWithPassword({ email: input.email, password: input.password });
    expect(login.success).toBe(true);
    expect(login.role).toBe("public");

    await expect(
      caller.auth.signInWithPassword({ email: input.email, password: "wrong-password-123" })
    ).rejects.toThrow(/Invalid email or password/);
    await expect(
      caller.auth.signInWithPassword({ email: "nope@example.com", password: input.password })
    ).rejects.toThrow(/Invalid email or password/);
  }, 30000);
});
