"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { engine, lerp, damp } from "@/lib/motion-engine";

/**
 * Translates its child against scroll, driven by the shared engine loop.
 *
 * The element's rect is cached and only re-measured on resize, so the
 * per-frame cost is one transform write and no layout read.
 */
export default function Parallax({
  children,
  speed = 0.15,
  axis = "y",
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  axis?: "x" | "y";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const budget = engine.getBudget();
    if (budget.reduceMotion) return;

    let top = 0;
    let height = 0;
    let visible = false;
    let current = 0;

    const measure = () => {
      // offsetTop walks the offset parent chain — no forced reflow from
      // transforms already applied to this element.
      const rect = el.getBoundingClientRect();
      top = rect.top + window.scrollY;
      height = rect.height;
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure, { passive: true });

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { rootMargin: "25% 0px" }
    );
    io.observe(el);

    const stop = engine.subscribe(({ scroll, viewportH, dt, budget: b }) => {
      if (!visible) return;

      // -1 entering from below → +1 leaving above
      const centre = top + height / 2 - scroll;
      const p = (centre - viewportH / 2) / viewportH;
      const target = -p * speed * 100 * b.amplitude;

      current = lerp(current, target, damp(12, dt));
      el.style.transform =
        axis === "y"
          ? `translate3d(0,${current.toFixed(2)}px,0)`
          : `translate3d(${current.toFixed(2)}px,0,0)`;
    });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [speed, axis]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
