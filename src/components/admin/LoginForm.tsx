"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type AuthState } from "@/app/admin/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-lime cut-corner-sm w-full disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useActionState<AuthState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="label-mono mb-2 block">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-bone/15 bg-transparent px-4 py-3.5 text-sm text-bone transition-colors outline-none placeholder:text-smoke/50 focus:border-lime"
          placeholder="admin@rave.lk"
        />
      </div>

      <div>
        <label htmlFor="password" className="label-mono mb-2 block">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full border border-bone/15 bg-transparent px-4 py-3.5 text-sm text-bone transition-colors outline-none placeholder:text-smoke/50 focus:border-lime"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="cut-corner-sm border border-hot/40 bg-hot/10 px-4 py-3 font-mono text-[11px] tracking-[0.1em] text-hot uppercase">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
