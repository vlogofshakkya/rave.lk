"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createAdminAction,
  updateAdminAction,
  deleteAdminAction,
  type AdminRow,
  type FormState,
} from "@/app/admin/actions/admins";
import { Card, Field, inputClass, Badge } from "@/components/admin/ui";

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-lime cut-corner-sm disabled:opacity-60"
    >
      {pending ? busy : label}
    </button>
  );
}

export default function AdminAccounts({
  admins,
  currentId,
  isOwner,
}: {
  admins: AdminRow[];
  currentId: number;
  isOwner: boolean;
}) {
  const [createState, createAction] = useActionState<FormState, FormData>(
    createAdminAction,
    {}
  );
  const [editState, editAction] = useActionState<FormState, FormData>(
    updateAdminAction,
    {}
  );
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-8">
      {/* Existing accounts */}
      <Card>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="label-mono">Accounts</h2>
          {isOwner && !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="btn btn-ghost cut-corner-sm !px-4 !py-2"
            >
              Add admin
            </button>
          )}
        </div>

        <ul className="divide-y divide-bone/8 border-y border-bone/8">
          {admins.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-bone">{a.name}</span>
                  <Badge tone={a.role === "owner" ? "lime" : "muted"}>{a.role}</Badge>
                  {a.id === currentId && <Badge tone="uv">You</Badge>}
                </div>
                <p className="mt-1 truncate font-mono text-[10px] text-smoke">
                  {a.email}
                </p>
              </div>

              {(isOwner || a.id === currentId) && (
                <button
                  type="button"
                  onClick={() => setEditing(a)}
                  className="link-sweep font-mono text-[10px] tracking-[0.14em] text-lime uppercase"
                >
                  Edit
                </button>
              )}

              {isOwner && a.id !== currentId && (
                <form action={deleteAdminAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="font-mono text-[10px] tracking-[0.14em] text-smoke uppercase transition-colors hover:text-hot"
                  >
                    Remove
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>

        {!isOwner && (
          <p className="mt-4 text-[11px] text-smoke">
            Only owner accounts can add or remove admins.
          </p>
        )}
      </Card>

      {/* Add */}
      {adding && isOwner && (
        <Card>
          <h2 className="label-mono mb-5">New admin</h2>
          <form action={createAction} className="max-w-md space-y-4">
            <Field label="Name" required>
              <input name="name" required className={inputClass} placeholder="Full name" />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                name="email"
                required
                className={inputClass}
                placeholder="name@rave.lk"
                autoComplete="off"
              />
            </Field>
            <Field label="Password" required hint="At least 8 characters.">
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className={inputClass}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Role" hint="Owners can manage other accounts.">
              <select name="role" defaultValue="admin" className={inputClass}>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </Field>

            {createState.error && (
              <p className="border border-hot/40 bg-hot/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-hot uppercase">
                {createState.error}
              </p>
            )}
            {createState.ok && (
              <p className="border border-lime/40 bg-lime/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-lime uppercase">
                {createState.ok}
              </p>
            )}

            <div className="flex gap-2">
              <Submit label="Create account" busy="Creating…" />
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="btn btn-ghost cut-corner-sm"
              >
                Done
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit dialog */}
      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-void/85 p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            className="my-8 w-full max-w-md border border-bone/15 bg-void-2 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="display-md mb-5 text-bone">Edit account</h3>
            <form action={editAction} className="space-y-4">
              <input type="hidden" name="id" value={editing.id} />

              <Field label="Name" required>
                <input
                  name="name"
                  required
                  defaultValue={editing.name}
                  className={inputClass}
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={editing.email}
                  className={inputClass}
                />
              </Field>
              <Field
                label="New password"
                hint="Leave blank to keep the current one."
              >
                <input
                  type="password"
                  name="password"
                  minLength={8}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </Field>

              {isOwner && editing.id !== currentId && (
                <Field label="Role">
                  <select
                    name="role"
                    defaultValue={editing.role}
                    className={inputClass}
                  >
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </Field>
              )}

              {editState.error && (
                <p className="border border-hot/40 bg-hot/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-hot uppercase">
                  {editState.error}
                </p>
              )}
              {editState.ok && (
                <p className="border border-lime/40 bg-lime/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-lime uppercase">
                  {editState.ok}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Submit label="Save" busy="Saving…" />
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-ghost cut-corner-sm"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
