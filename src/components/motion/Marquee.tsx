"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { engine, lerp, damp } from "@/lib/motion-engine";

/**
 * Infinite ticker. Content is duplicated once and the track animates to
 * -50%, so the loop is seamless.
 *
 * Scroll direction shears the skew, which is what stops it reading as a
 * static CSS marquee. The shear is driven by the shared engine loop.
 */
export default function Marquee({
  children,
  duration = 30,
  direction = "left",
  reactive = true,
  className = "",
}: {
  children: ReactNode;
  duration?: number;
  direction?: "left" | "right";
  reactive?: boolean;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reactive) return;
    const el = wrap.current;
    if (!el) return;

    const budget = engine.getBudget();
    if (budget.reduceMotion) return;

    let skew = 0;
    let visible = false;

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      // Park it flat when scrolled away so it resumes clean.
      if (!visible) el.style.transform = "skewX(0deg)";
    });
    io.observe(el);

    const stop = engine.subscribe(({ delta, dt, budget: b }) => {
      if (!visible) return;
      const target = Math.max(-7, Math.min(7, delta * 0.3)) * b.amplitude;
      skew = lerp(skew, target, damp(6, dt));
      el.style.transform = `skewX(${skew.toFixed(2)}deg)`;
    });

    return () => {
      stop();
      io.disconnect();
    };
  }, [reactive]);

  return (
    <div ref={wrap} className={`marquee overflow-hidden ${className}`}>
      <div
        className="marquee-track"
        data-dir={direction}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
