"use client";

import { useState } from "react";
import Magnetic from "@/components/motion/Magnetic";

const TOPICS = ["General", "Tickets", "Artist booking", "Press", "Partnership"];

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: TOPICS[0],
    message: "",
  });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Message failed to send");
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Message failed to send");
    }
  }

  if (state === "done") {
    return (
      <div className="cut-corner-sm border border-lime/40 bg-lime/8 p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-lime text-xl text-lime">
          ✓
        </div>
        <p className="display-md mb-2 text-bone">Message sent</p>
        <p className="text-sm text-smoke">
          We&apos;ll get back to you within two working days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label-mono mb-2 block">
            Name
          </label>
          <input
            id="c-name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-bone/15 bg-transparent px-4 py-3.5 text-sm text-bone transition-colors outline-none placeholder:text-smoke/50 focus:border-lime"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="c-email" className="label-mono mb-2 block">
            Email
          </label>
          <input
            id="c-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full border border-bone/15 bg-transparent px-4 py-3.5 text-sm text-bone transition-colors outline-none placeholder:text-smoke/50 focus:border-lime"
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div>
        <p className="label-mono mb-2">What&apos;s it about?</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, topic: t }))}
              aria-pressed={form.topic === t}
              className={[
                "cut-corner-sm border px-3.5 py-2 font-mono text-[10px] tracking-[0.14em] uppercase transition-all duration-400",
                form.topic === t
                  ? "border-lime bg-lime text-void"
                  : "border-bone/15 text-smoke hover:border-bone/40 hover:text-bone",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="c-message" className="label-mono mb-2 block">
          Message
        </label>
        <textarea
          id="c-message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full resize-y border border-bone/15 bg-transparent px-4 py-3.5 text-sm text-bone transition-colors outline-none placeholder:text-smoke/50 focus:border-lime"
          placeholder="Tell us what you need…"
        />
      </div>

      {state === "error" && (
        <p className="cut-corner-sm border border-hot/40 bg-hot/10 px-4 py-3 font-mono text-[11px] tracking-[0.1em] text-hot uppercase">
          {error}
        </p>
      )}

      <Magnetic strength={0.22} className="block">
        <button
          type="submit"
          disabled={state === "loading"}
          className="btn btn-lime cut-corner-sm w-full disabled:opacity-60"
        >
          {state === "loading" ? "Sending…" : "Send message"}
        </button>
      </Magnetic>
    </form>
  );
}
