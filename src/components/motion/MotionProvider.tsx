"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { engine } from "@/lib/motion-engine";
import { getBudget, applyBudgetToCss } from "@/lib/perf";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Boots the motion system: publishes the device budget to CSS, starts
 * momentum scrolling, and drives all scroll reveals from one observer.
 *
 * Replaces the old SmoothScroll + RevealProvider pair so there is a single
 * place where global motion is set up and torn down.
 */
export default function MotionProvider() {
  const pathname = usePathname();

  // ── Budget → CSS, and keep the engine warm ──────────────────
  useEffect(() => {
    const budget = getBudget();
    applyBudgetToCss(budget);

    // An always-on subscriber keeps the shared loop alive so per-component
    // subscribes never pay start-up cost mid-scroll.
    const stop = engine.subscribe(() => {});
    return stop;
  }, []);

  // ── Momentum scroll ─────────────────────────────────────────
  useEffect(() => {
    const budget = getBudget();
    if (budget.reduceMotion) return;

    const lenis = new Lenis({
      // Lighter devices get a shorter glide: long eases feel like lag when
      // frames are already scarce.
      duration: budget.tier === "low" ? 0.7 : budget.tier === "mid" ? 0.95 : 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.7,
      syncTouch: false,
    });

    window.__lenis = lenis;

    // Lenis is driven by the shared loop rather than its own rAF.
    const stop = engine.subscribe(({ time }) => lenis.raf(time * 1000));

    return () => {
      stop();
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  // ── Scroll reveals ──────────────────────────────────────────
  useEffect(() => {
    const budget = getBudget();

    const collect = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-group]")
      );

    if (budget.reduceMotion) {
      const show = () => collect().forEach((n) => n.classList.add("is-in"));
      show();
      const mo = new MutationObserver(show);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const applyStagger = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal-group]")
        .forEach((group) => {
          const step = Number(group.dataset.stagger ?? 80);
          Array.from(group.children).forEach((child, i) => {
            const el = child as HTMLElement;
            if (el.hasAttribute("data-reveal") && !el.style.transitionDelay) {
              el.style.transitionDelay = `${i * step}ms`;
            }
          });
        });
    };
    applyStagger();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 }
    );

    const observe = () =>
      collect().forEach((n) => {
        if (!n.classList.contains("is-in")) io.observe(n);
      });
    observe();

    // Anything already on screen at load reveals immediately.
    const flush = () =>
      collect().forEach((n) => {
        if (n.classList.contains("is-in")) return;
        const r = n.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
          n.classList.add("is-in");
          io.unobserve(n);
        }
      });
    requestAnimationFrame(flush);

    // Tab panels and filtered grids mount after this effect runs.
    const mo = new MutationObserver(() => {
      applyStagger();
      observe();
      requestAnimationFrame(flush);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  // Reset scroll on navigation — Lenis holds its own position.
  useEffect(() => {
    window.__lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
