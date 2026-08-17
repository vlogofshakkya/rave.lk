import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { queryOne } from "./db";
import { config } from "@/config";
import type { AdminUser } from "./types";

const COOKIE = "rave_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secret() {
  const s = config.authSecret;
  if (!s || s.length < 16) {
    throw new Error(
      "Auth secret is missing or too short — set AUTH_SECRET, or check src/config.ts"
    );
  }
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: "owner" | "admin";
}

export async function createSession(user: AdminUser) {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Throws if there is no valid session — use at the top of admin actions. */
export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AdminUser | null> {
  const row = await queryOne<AdminUser & { password_hash: string }>(
    "SELECT id, name, email, role, password_hash FROM admins WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()]
  );
  if (!row) {
    // Constant-ish work even when the user is missing, to avoid leaking
    // which emails exist via response timing.
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
    return null;
  }
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
