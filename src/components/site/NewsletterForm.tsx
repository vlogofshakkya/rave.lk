"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setState("done");
      setMessage(data.message ?? "You're on the list.");
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (state === "done") {
    return (
      <p className="cut-corner-sm border border-lime/40 bg-lime/10 px-4 py-3 font-mono text-[11px] tracking-[0.12em] text-lime uppercase">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="you@email.com"
          aria-label="Email address"
          className="min-w-0 flex-1 border border-bone/15 bg-transparent px-4 py-3 text-sm text-bone transition-colors outline-none placeholder:text-smoke/60 focus:border-lime"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="shrink-0 bg-lime px-5 font-mono text-[10px] font-bold tracking-[0.14em] text-void uppercase transition-colors duration-300 hover:bg-bone disabled:opacity-60"
        >
          {state === "loading" ? "···" : "Join"}
        </button>
      </div>
      {state === "error" && (
        <p className="font-mono text-[10px] tracking-[0.1em] text-hot uppercase">
          {message}
        </p>
      )}
    </form>
  );
}
