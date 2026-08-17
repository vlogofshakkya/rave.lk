"use client";

import { useEffect, useRef } from "react";
import { engine } from "@/lib/motion-engine";

/**
 * SIGNATURE ELEMENT — the "frequency spine".
 *
 * A vertical level meter pinned to the right edge. The fill tracks scroll
 * progress; bar amplitude tracks scroll velocity, so the page reads like a
 * mixing desk responding to how hard you're riding it.
 *
 * Now driven by the shared engine loop — bar count scales with the device
 * budget, but the meter itself is present on every device.
 */
export default function ScrollSpine() {
  const fill = useRef<HTMLDivElement>(null);
  const bars = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const budget = engine.getBudget();
    if (budget.reduceMotion) return;

    const barEls = Array.from(bars.current?.querySelectorAll<HTMLElement>("i") ?? []);
    const phases = barEls.map((_, i) => (i / barEls.length) * Math.PI * 2);
    let lastPct = -1;

    const stop = engine.subscribe(({ progress, velocity, time, budget: b }) => {
      if (fill.current) {
        fill.current.style.transform = `scaleY(${progress.toFixed(4)})`;
      }

      // Only touch the DOM when the rounded value actually changes.
      const p = Math.round(progress * 100);
      if (p !== lastPct && pct.current) {
        pct.current.textContent = String(p).padStart(2, "0");
        lastPct = p;
      }

      for (let i = 0; i < barEls.length; i++) {
        const wave = (Math.sin(time * 3 + phases[i]) + 1) / 2;
        const amp = 0.16 + wave * (0.2 + velocity * 0.64) * b.amplitude;
        barEls[i].style.transform = `scaleX(${amp.toFixed(3)})`;
      }
    });

    return stop;
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-1/2 right-3 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex"
    >
      <span className="font-mono text-[9px] tracking-[0.2em] text-smoke">
        <span ref={pct}>00</span>
      </span>

      <div className="relative h-40 w-px bg-bone/15">
        <div
          ref={fill}
          className="absolute inset-x-0 top-0 h-full origin-top bg-lime"
          style={{ transform: "scaleY(0)" }}
        />
      </div>

      <div ref={bars} className="flex flex-col items-end gap-[3px]">
        {Array.from({ length: 14 }).map((_, i) => (
          <i
            key={i}
            className="block h-[2px] w-6 origin-right bg-lime/60"
            style={{ transform: "scaleX(0.18)" }}
          />
        ))}
      </div>
    </div>
  );
}
