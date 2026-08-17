"use server";

import { revalidatePath } from "next/cache";
import { execute, query, queryOne } from "@/lib/db";
import { requireSession, hashPassword } from "@/lib/auth";

export interface FormState {
  error?: string;
  ok?: string;
}

export interface AdminRow {
  id: number;
  name: string;
  email: string;
  role: "owner" | "admin";
  created_at: string;
}

export async function listAdmins(): Promise<AdminRow[]> {
  await requireSession();
  return query<AdminRow>(
    "SELECT id, name, email, role, created_at FROM admins ORDER BY FIELD(role,'owner','admin'), created_at ASC"
  );
}

export async function createAdminAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const session = await requireSession();

  // Only owners may create accounts — otherwise any admin could escalate
  // by minting themselves a second login.
  if (session.role !== "owner") {
    return { error: "Only the owner account can add admins" };
  }

  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = String(fd.get("role") ?? "admin") === "owner" ? "owner" : "admin";

  if (name.length < 2) return { error: "Enter a name" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email" };
  if (password.length < 8) return { error: "Use a password of at least 8 characters" };

  const clash = await queryOne<{ id: number }>(
    "SELECT id FROM admins WHERE email = ? LIMIT 1",
    [email]
  );
  if (clash) return { error: "That email already has an account" };

  await execute(
    "INSERT INTO admins (name, email, password_hash, role) VALUES (?,?,?,?)",
    [name, email, await hashPassword(password), role]
  );

  revalidatePath("/admin/admins");
  return { ok: `${name} can now sign in` };
}

export async function updateAdminAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState> {
  const session = await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return { error: "Missing account" };

  const isSelf = id === Number(session.sub);
  if (session.role !== "owner" && !isSelf) {
    return { error: "You can only edit your own account" };
  }

  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");

  if (name.length < 2) return { error: "Enter a name" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email" };

  const clash = await queryOne<{ id: number }>(
    "SELECT id FROM admins WHERE email = ? AND id <> ? LIMIT 1",
    [email, id]
  );
  if (clash) return { error: "Another account already uses that email" };

  // Role changes are owner-only, and an owner cannot demote themselves —
  // that would leave the site with no one able to manage accounts.
  let role: "owner" | "admin" | null = null;
  if (session.role === "owner") {
    const requested = String(fd.get("role") ?? "");
    if (requested === "owner" || requested === "admin") {
      if (isSelf && requested === "admin") {
        return { error: "You can't remove your own owner access" };
      }
      role = requested;
    }
  }

  if (password) {
    if (password.length < 8) return { error: "Use a password of at least 8 characters" };
    await execute("UPDATE admins SET password_hash = ? WHERE id = ?", [
      await hashPassword(password),
      id,
    ]);
  }

  if (role) {
    await execute("UPDATE admins SET name=?, email=?, role=? WHERE id=?", [
      name, email, role, id,
    ]);
  } else {
    await execute("UPDATE admins SET name=?, email=? WHERE id=?", [name, email, id]);
  }

  revalidatePath("/admin/admins");
  return { ok: "Account updated" };
}

export async function deleteAdminAction(fd: FormData) {
  const session = await requireSession();
  const id = Number(fd.get("id"));
  if (!id) return;

  if (session.role !== "owner") return;
  // Never delete yourself, and never remove the last owner.
  if (id === Number(session.sub)) return;

  const target = await queryOne<{ role: string }>(
    "SELECT role FROM admins WHERE id = ?",
    [id]
  );
  if (target?.role === "owner") {
    const owners = await queryOne<{ c: number }>(
      "SELECT COUNT(*) c FROM admins WHERE role = 'owner'"
    );
    if ((owners?.c ?? 0) <= 1) return;
  }

  await execute("DELETE FROM admins WHERE id = ?", [id]);
  revalidatePath("/admin/admins");
}
