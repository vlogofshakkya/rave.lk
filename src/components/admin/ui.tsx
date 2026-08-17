import Link from "next/link";
import type { ReactNode } from "react";

export function AdminHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display-md text-bone">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-smoke">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`cut-corner-sm border border-bone/12 bg-void-2 p-5 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-mono mb-2 block">
        {label}
        {required && <span className="ml-1 text-lime">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] text-smoke">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full border border-bone/15 bg-void px-3.5 py-2.5 text-sm text-bone transition-colors outline-none placeholder:text-smoke/50 focus:border-lime";

export function Empty({
  title,
  copy,
  action,
}: {
  title: string;
  copy?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-bone/15 px-6 py-16 text-center">
      <p className="display-md mb-2 text-bone">{title}</p>
      {copy && <p className="mx-auto mb-6 max-w-sm text-sm text-smoke">{copy}</p>}
      {action}
    </div>
  );
}

const TONES = {
  lime: "border-lime/40 bg-lime/10 text-lime",
  hot: "border-hot/40 bg-hot/10 text-hot",
  uv: "border-uv/50 bg-uv/15 text-bone",
  muted: "border-bone/15 bg-bone/5 text-smoke",
} as const;

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={`inline-block border px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] uppercase ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  href?: string;
  accent?: boolean;
}) {
  const inner = (
    <>
      <div
        className={`font-display text-3xl leading-none tabular-nums md:text-4xl ${
          accent ? "text-lime" : "text-bone"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-smoke uppercase">
        {label}
      </p>
    </>
  );

  const cls =
    "cut-corner-sm block border border-bone/12 bg-void-2 p-5 transition-colors duration-300";

  return href ? (
    <Link href={href} className={`${cls} hover:border-lime/50`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
