"use client";

import { useEffect, useRef } from "react";
import { engine, lerp, damp } from "@/lib/motion-engine";

/**
 * Trailing ring cursor that swells and labels itself over interactive
 * targets. Pointer-fine only — on touch there is no pointer to follow, so
 * it is never mounted rather than being a dropped feature.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const budget = engine.getBudget();
    if (!budget.pointerFX || budget.reduceMotion) return;

    const r = ring.current;
    const d = dot.current;
    const l = label.current;
    if (!r || !d || !l) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let scale = 1;
    let targetScale = 1;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      // The dot is exact; only the ring lags.
      d.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
    };

    const stop = engine.subscribe(({ dt }) => {
      const k = damp(14, dt);
      rx = lerp(rx, mx, k);
      ry = lerp(ry, my, k);
      scale = lerp(scale, targetScale, k);
      r.style.transform =
        `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0) ` +
        `translate(-50%,-50%) scale(${scale.toFixed(3)})`;
    });

    /** The element currently under the pointer, so its label can be re-read. */
    let hovered: HTMLElement | null = null;

    const syncLabel = () => {
      const text = hovered?.dataset.cursor ?? "";
      if (l.textContent !== text) l.textContent = text;
      if (hovered) {
        targetScale = text ? 2.6 : 1.9;
        r.dataset.active = "true";
      } else {
        targetScale = 1;
        r.dataset.active = "false";
      }
    };

    const onOver = (e: PointerEvent) => {
      hovered = (e.target as HTMLElement).closest<HTMLElement>(
        "a, button, [data-cursor], input, textarea, select, [role='button']"
      );
      syncLabel();
    };

    /**
     * A target's data-cursor can change while the pointer sits still (the
     * menu toggle flips Menu → Close). Without re-reading it, the ring keeps
     * painting the old word over the button's new label.
     */
    const labelObserver = new MutationObserver(syncLabel);
    labelObserver.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-cursor"],
    });

    const onDown = () => (targetScale *= 0.8);
    const onUp = () => syncLabel();
    const onLeave = () => {
      r.style.opacity = "0";
      d.style.opacity = "0";
    };
    const onEnter = () => {
      r.style.opacity = "1";
      d.style.opacity = "1";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    document.documentElement.style.cursor = "none";

    return () => {
      stop();
      labelObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      document.documentElement.style.cursor = "";
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
      <div
        ref={ring}
        data-active="false"
        className="absolute top-0 left-0 grid h-10 w-10 place-items-center rounded-full border border-lime/70 transition-[opacity,background-color,border-color] duration-300 data-[active=true]:border-lime data-[active=true]:bg-lime/10"
      >
        <span
          ref={label}
          className="font-mono text-[7px] font-bold tracking-[0.14em] text-lime uppercase"
        />
      </div>
      <div
        ref={dot}
        className="absolute top-0 left-0 h-1.5 w-1.5 rounded-full bg-lime transition-opacity duration-300"
      />
    </div>
  );
}
