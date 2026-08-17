"use client";

import { useEffect, useRef, useState } from "react";

/**
 * First-visit intro: a load counter racing to 100, then the black
 * shutters split apart to reveal the hero. Shown once per session so
 * repeat navigation is never gated behind an animation.
 */
/** Only the first visit in a session gets the intro, and never under reduced motion. */
function shouldPlay() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return !sessionStorage.getItem("rave_intro");
}

export default function Preloader() {
  /**
   * Starts closed on BOTH server and client so the first client render
   * matches the server HTML exactly — sessionStorage and matchMedia are
   * unavailable during SSR, so deciding this before mount would hydrate
   * mismatched. The effect below opens it after mount when appropriate.
   */
  const [done, setDone] = useState(true);
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!shouldPlay()) return;

    // Intentional: sessionStorage/matchMedia can only be read after mount,
    // so opening the intro here is the only way to keep the first render
    // identical to the server HTML. One extra render on first visit only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDone(false);
    document.body.style.overflow = "hidden";
    sessionStorage.setItem("rave_intro", "1");

    const start = performance.now();
    const DURATION = 1700;
    let raf = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      setCount(100);
      setLeaving(true);
      window.setTimeout(() => {
        setDone(true);
        document.body.style.overflow = "";
        window.dispatchEvent(new Event("rave:intro-done"));
      }, 900);
    };

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(step);
      else finish();
    };
    raf = requestAnimationFrame(step);

    // Safety net: if rAF is throttled (background tab, reduced power mode)
    // the intro must still get out of the way rather than trapping the page.
    const failsafe = window.setTimeout(finish, DURATION + 600);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
      document.body.style.overflow = "";
    };
    // Mount-only: the `started` ref guards double-invocation in development.
  }, []);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[10000]" aria-hidden>
      {/* Split shutters */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 bg-void transition-transform duration-[900ms]"
        style={{
          transform: leaving ? "translateY(-100%)" : "translateY(0)",
          transitionTimingFunction: "cubic-bezier(0.76,0,0.24,1)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-void transition-transform duration-[900ms]"
        style={{
          transform: leaving ? "translateY(100%)" : "translateY(0)",
          transitionTimingFunction: "cubic-bezier(0.76,0,0.24,1)",
        }}
      />

      <div
        className="absolute inset-0 grid place-items-center transition-opacity duration-300"
        style={{ opacity: leaving ? 0 : 1 }}
      >
        <div className="w-full max-w-md px-8 text-center">
          <div className="mb-6 overflow-hidden">
            <span className="eyebrow block">Rave.LK</span>
          </div>
          <div className="font-display text-[22vw] leading-none text-bone tabular-nums md:text-[9rem]">
            {String(count).padStart(3, "0")}
          </div>
          <div className="mt-6 h-px w-full bg-bone/15">
            <div
              className="h-full bg-lime transition-none"
              style={{ width: `${count}%` }}
            />
          </div>
          <p className="label-mono mt-4">Loading the island&apos;s loudest</p>
        </div>
      </div>
    </div>
  );
}
