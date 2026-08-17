"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  changePasswordAction,
  type FormState,
} from "@/app/admin/actions/content";
import { Card, Field, inputClass } from "@/components/admin/ui";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-ghost cut-corner-sm disabled:opacity-60"
    >
      {pending ? "Updating…" : "Change password"}
    </button>
  );
}

export default function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(
    changePasswordAction,
    {}
  );

  return (
    <Card>
      <h2 className="label-mono mb-2">Your password</h2>
      <p className="mb-5 text-sm text-smoke">
        Change the password you use to sign in to this admin.
      </p>

      <form action={action} className="max-w-sm space-y-4">
        <Field label="New password" required hint="At least 8 characters.">
          <input
            type="password"
            name="new_password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <Field label="Confirm new password" required>
          <input
            type="password"
            name="confirm_password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>

        {state.error && (
          <p className="border border-hot/40 bg-hot/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-hot uppercase">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="border border-lime/40 bg-lime/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-lime uppercase">
            {state.ok}
          </p>
        )}

        <Save />
      </form>
    </Card>
  );
}
