"use client";

import { useRef, type ReactNode } from "react";

/**
 * 3D tilt toward the pointer with a specular sheen that tracks the same
 * position. Used for event posters so they behave like physical flyers.
 */
export default function TiltCard({
  children,
  max = 9,
  className = "",
  sheen = true,
}: {
  children: ReactNode;
  max?: number;
  className?: string;
  sheen?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * max * 2;
    const ry = (px - 0.5) * max * 2;

    el.style.transition = "transform 0.15s ease-out";
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;

    if (glare.current) {
      glare.current.style.opacity = "1";
      glare.current.style.background = `radial-gradient(500px circle at ${px * 100}% ${py * 100}%, rgba(200,255,0,0.18), transparent 45%)`;
    }
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.7s cubic-bezier(0.16,1,0.3,1)";
    el.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
    if (glare.current) glare.current.style.opacity = "0";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
      {sheen && (
        <div
          ref={glare}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500"
        />
      )}
    </div>
  );
}
