/**
 * MOTION ENGINE
 *
 * One requestAnimationFrame loop for the entire site, wired to the
 * Optimize Engine's budget.
 *
 * Why a single loop: every component previously ran its own rAF. Twenty
 * loops each doing `getBoundingClientRect()` is twenty forced layouts per
 * frame, which is what made the page feel heavy. Here, scroll state is
 * measured once per frame and handed to every subscriber, so cost grows
 * with work done rather than with the number of animated components.
 *
 * Nothing is ever dropped for performance — the budget only changes fps,
 * density, blur and amplitude. A weak device runs the same choreography,
 * lighter.
 */

import { getBudget, downgrade, applyBudgetToCss, type Budget } from "./perf";

export interface FrameState {
  /** Current scroll position in px. */
  scroll: number;
  /** Signed scroll delta since last frame. */
  delta: number;
  /** Smoothed absolute velocity, normalised roughly 0..1. */
  velocity: number;
  /** Document scroll progress 0..1. */
  progress: number;
  /** Seconds since the engine started. */
  time: number;
  /** Delta time in seconds, clamped to avoid post-stall jumps. */
  dt: number;
  viewportW: number;
  viewportH: number;
  budget: Budget;
}

type Subscriber = (s: FrameState) => void;

class Engine {
  private subs = new Set<Subscriber>();
  private raf = 0;
  private running = false;
  private lastFrame = 0;
  private lastScroll = 0;
  private start = 0;
  private smoothVel = 0;
  // Resolved on first subscribe (client-only), not at construction.
  private budget: Budget = getBudget();

  // Frame-time watchdog
  private slowFrames = 0;
  private checkedAt = 0;

  private state: FrameState = {
    scroll: 0, delta: 0, velocity: 0, progress: 0,
    time: 0, dt: 0, viewportW: 0, viewportH: 0,
    budget: this.budget,
  };

  /** Cached layout metrics — read on resize, never per frame. */
  private docHeight = 0;

  subscribe(fn: Subscriber): () => void {
    this.subs.add(fn);
    if (!this.running) this.startLoop();
    return () => {
      this.subs.delete(fn);
      if (this.subs.size === 0) this.stopLoop();
    };
  }

  getState(): FrameState {
    return this.state;
  }

  getBudget(): Budget {
    return this.budget;
  }

  private measure = () => {
    this.state.viewportW = window.innerWidth;
    this.state.viewportH = window.innerHeight;
    this.docHeight = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
  };

  private startLoop() {
    if (this.running) return;
    this.running = true;
    this.budget = getBudget();
    applyBudgetToCss(this.budget);

    this.measure();
    window.addEventListener("resize", this.measure, { passive: true });
    window.addEventListener("orientationchange", this.measure, { passive: true });

    this.start = performance.now();
    this.lastFrame = this.start;
    this.checkedAt = this.start;
    this.lastScroll = window.scrollY;
    this.raf = requestAnimationFrame(this.tick);
  }

  private stopLoop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.measure);
    window.removeEventListener("orientationchange", this.measure);
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);

    const minInterval = 1000 / this.budget.fps;
    const since = now - this.lastFrame;
    // Frame pacing: on a 30fps budget this skips every other vsync rather
    // than doing work it cannot finish.
    if (since < minInterval - 1) return;

    const dt = Math.min(since / 1000, 0.05);
    this.lastFrame = now;

    const scroll = window.scrollY;
    const delta = scroll - this.lastScroll;
    this.lastScroll = scroll;

    // Exponential smoothing keeps velocity usable for visuals.
    const raw = Math.min(1, Math.abs(delta) / 60);
    this.smoothVel += (raw - this.smoothVel) * Math.min(1, dt * 8);

    const s = this.state;
    s.scroll = scroll;
    s.delta = delta;
    s.velocity = this.smoothVel;
    s.progress = Math.min(1, Math.max(0, scroll / this.docHeight));
    s.time = (now - this.start) / 1000;
    s.dt = dt;
    s.budget = this.budget;

    for (const fn of this.subs) {
      try {
        fn(s);
      } catch {
        // A throwing subscriber must not stop the whole site's motion.
      }
    }

    this.watchdog(now, since);
  };

  /**
   * If frames consistently overrun the budget, step the tier down. This is
   * what keeps a throttling phone smooth instead of janky.
   */
  private watchdog(now: number, frameTime: number) {
    if (frameTime > (1000 / this.budget.fps) * 2) this.slowFrames++;

    if (now - this.checkedAt < 2500) return;
    const wasSlow = this.slowFrames > 20;
    this.slowFrames = 0;
    this.checkedAt = now;

    if (wasSlow && this.budget.tier !== "low") {
      this.budget = downgrade();
      applyBudgetToCss(this.budget);
    }
  }
}

/**
 * Shared instance. Constructing it is side-effect free (the rAF loop only
 * starts on the first subscribe), so it is safe to create during SSR —
 * subscribers all live in effects, which never run on the server.
 */
export const engine = new Engine();

/* ── Helpers ─────────────────────────────────────────────────── */

/** Linear interpolation used by most easing in the engine's subscribers. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Frame-rate-independent smoothing factor. */
export function damp(rate: number, dt: number) {
  return 1 - Math.exp(-rate * dt);
}

export function clamp(v: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

/** 0..1 progress of an element through the viewport. */
export function viewportProgress(rect: DOMRect, viewportH: number) {
  return clamp((viewportH - rect.top) / (viewportH + rect.height));
}
