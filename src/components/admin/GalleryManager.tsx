"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addGalleryAction,
  deleteGalleryAction,
  updateGalleryAction,
  type FormState,
} from "@/app/admin/actions/content";
import { Card, Field, inputClass, Badge, Empty } from "@/components/admin/ui";
import type { GalleryItem, EventRow } from "@/lib/types";

interface Pending {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

function SaveBtn({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      className="btn btn-lime cut-corner-sm disabled:opacity-40"
    >
      {pending ? "Saving…" : `Add ${count || ""} photo${count === 1 ? "" : "s"}`}
    </button>
  );
}

export default function GalleryManager({
  items,
  events,
}: {
  items: GalleryItem[];
  events: Pick<EventRow, "id" | "title">[];
}) {
  const [state, action] = useActionState<FormState, FormData>(addGalleryAction, {});
  const [staged, setStaged] = useState<Pending[]>([]);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setError("");
    setUploading(files.length);
    const results: Pending[] = [];

    // Sequential rather than parallel: Cloudinary's free tier rate-limits
    // bursts, and a partial batch is harder to reason about than a slow one.
    for (const file of Array.from(files)) {
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("folder", "rave-lk/gallery");
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        results.push({
          url: data.url,
          publicId: data.publicId,
          width: data.width,
          height: data.height,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    setStaged((s) => [...s, ...results]);
  }

  return (
    <div className="space-y-8">
      {/* Upload */}
      <Card>
        <h2 className="label-mono mb-5">Add photos</h2>

        <form action={action}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid w-full place-items-center border border-dashed border-bone/20 py-10 transition-colors hover:border-lime"
          >
            <span className="font-mono text-[11px] tracking-[0.14em] text-smoke uppercase">
              {uploading > 0
                ? `Uploading ${uploading}…`
                : "Click to choose photos — you can pick several"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {staged.length > 0 && (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                {staged.map((p, i) => (
                  <div key={p.url} className="relative h-20 w-20 overflow-hidden border border-bone/15">
                    <Image src={p.url} alt="" fill sizes="80px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setStaged((s) => s.filter((_, j) => j !== i))}
                      aria-label="Remove"
                      className="absolute top-0 right-0 grid h-5 w-5 place-items-center bg-void/90 text-[10px] text-hot"
                    >
                      ✕
                    </button>
                    <input type="hidden" name="image_url" value={p.url} />
                    <input type="hidden" name="public_id" value={p.publicId} />
                    <input type="hidden" name="width" value={p.width} />
                    <input type="hidden" name="height" value={p.height} />
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Field label="Caption" hint="Applied to all in this batch.">
                  <input name="title" className={inputClass} placeholder="Crowd at peak" />
                </Field>
                <Field label="Category" hint="Used as a gallery filter.">
                  <input name="category" className={inputClass} placeholder="crowd" list="cats" />
                </Field>
                <Field label="Link to event">
                  <select name="event_id" className={inputClass} defaultValue="">
                    <option value="">None</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-3">
                <input type="checkbox" name="featured" className="h-4 w-4 accent-[#c8ff00]" />
                <span className="text-sm text-bone">Show on the homepage</span>
              </label>

              <div className="mt-5 flex gap-2">
                <SaveBtn count={staged.length} />
                <button
                  type="button"
                  onClick={() => setStaged([])}
                  className="btn btn-ghost cut-corner-sm"
                >
                  Clear
                </button>
              </div>
            </>
          )}

          {(error || state.error) && (
            <p className="mt-4 border border-hot/40 bg-hot/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-hot uppercase">
              {error || state.error}
            </p>
          )}
          {state.ok && (
            <p className="mt-4 border border-lime/40 bg-lime/10 px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-lime uppercase">
              {state.ok}
            </p>
          )}
        </form>
      </Card>

      <datalist id="cats">
        {Array.from(new Set(items.map((i) => i.category).filter(Boolean))).map((c) => (
          <option key={c!} value={c!} />
        ))}
      </datalist>

      {/* Grid */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="label-mono">All photos</h2>
          <span className="font-mono text-[10px] text-smoke">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <Empty title="No photos yet" copy="Upload your first batch above." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item) => (
              <div key={item.id} className="group relative">
                <div className="relative aspect-square overflow-hidden bg-void-3">
                  <Image
                    src={item.image_url}
                    alt={item.title ?? ""}
                    fill
                    sizes="(max-width:640px) 45vw, 20vw"
                    className="object-cover"
                  />
                  {item.featured === 1 && (
                    <span className="absolute top-1.5 left-1.5">
                      <Badge tone="lime">Home</Badge>
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-end gap-1 bg-void/80 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="flex-1 border border-bone/25 py-1.5 font-mono text-[9px] tracking-[0.1em] text-bone uppercase transition-colors hover:border-lime hover:text-lime"
                    >
                      Edit
                    </button>
                    <form action={deleteGalleryAction} className="flex-1">
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="w-full border border-bone/25 py-1.5 font-mono text-[9px] tracking-[0.1em] text-bone uppercase transition-colors hover:border-hot hover:text-hot"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
                <p className="mt-1.5 truncate font-mono text-[9px] text-smoke">
                  {item.title ?? "Untitled"}
                  {item.category ? ` · ${item.category}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit dialog */}
      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-void/85 p-4 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-md border border-bone/15 bg-void-2 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="display-md mb-5 text-bone">Edit photo</h3>
            <form
              action={async (fd) => {
                await updateGalleryAction(fd);
                setEditing(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editing.id} />
              <div className="relative aspect-video overflow-hidden bg-void-3">
                <Image
                  src={editing.image_url}
                  alt=""
                  fill
                  sizes="400px"
                  className="object-contain"
                />
              </div>
              <Field label="Caption">
                <input
                  name="title"
                  defaultValue={editing.title ?? ""}
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <input
                    name="category"
                    defaultValue={editing.category ?? ""}
                    className={inputClass}
                    list="cats"
                  />
                </Field>
                <Field label="Sort order">
                  <input
                    type="number"
                    name="sort_order"
                    defaultValue={editing.sort_order}
                    className={inputClass}
                  />
                </Field>
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={editing.featured === 1}
                  className="h-4 w-4 accent-[#c8ff00]"
                />
                <span className="text-sm text-bone">Show on the homepage</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn btn-lime cut-corner-sm flex-1">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-ghost cut-corner-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
