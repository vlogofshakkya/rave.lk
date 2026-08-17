"use client";

import { useRef, type ReactNode } from "react";

/**
 * Pulls its child toward the pointer, then springs back on leave.
 * Pointer-fine only; on touch it renders as a plain wrapper.
 */
export default function Magnetic({
  children,
  strength = 0.35,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transition = "transform 0.1s linear";
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.7s cubic-bezier(0.16,1,0.3,1)";
    el.style.transform = "translate3d(0,0,0)";
  };

  return (
    <span
      className={`inline-block ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span ref={ref} className="inline-block will-change-transform">
        {children}
      </span>
    </span>
  );
}
