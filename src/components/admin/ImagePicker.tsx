"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * Upload-or-paste image field. Uploads go to Cloudinary through
 * /api/admin/upload; the resulting URL is written into a hidden input so
 * the surrounding server action reads it like any other form value.
 */
export default function ImagePicker({
  name,
  label,
  defaultValue = "",
  aspect = "aspect-[3/4]",
  folder = "rave-lk",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  aspect?: string;
  folder?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="label-mono mb-2 block">{label}</span>
      <input type="hidden" name={name} value={url} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`relative ${aspect} w-24 shrink-0 overflow-hidden border border-bone/15 bg-void transition-colors hover:border-lime`}
        >
          {url ? (
            <Image src={url} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <span className="grid h-full place-items-center font-mono text-[9px] tracking-[0.12em] text-smoke uppercase">
              {busy ? "…" : "Upload"}
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-void/80 font-mono text-[9px] text-lime">
              …
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste an image URL, or upload"
            className="w-full border border-bone/15 bg-void px-3 py-2 font-mono text-[11px] text-bone outline-none focus:border-lime"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="border border-bone/15 px-3 py-1.5 font-mono text-[9px] tracking-[0.12em] text-smoke uppercase transition-colors hover:border-lime hover:text-lime disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Choose file"}
            </button>
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="border border-bone/15 px-3 py-1.5 font-mono text-[9px] tracking-[0.12em] text-smoke uppercase transition-colors hover:border-hot hover:text-hot"
              >
                Clear
              </button>
            )}
          </div>
          {error && (
            <p className="font-mono text-[10px] tracking-[0.1em] text-hot uppercase">
              {error}
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
