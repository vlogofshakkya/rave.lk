/**
 * OPTIMIZE ENGINE
 *
 * Grades the current device once, then exposes a "budget" that the motion
 * engine reads. The rule this encodes: never drop a feature, only reduce
 * its weight. Every animation, effect and element runs on every device —
 * a low-tier phone gets the same choreography at cheaper settings
 * (fewer particles, coarser blur, capped frame rate, shorter trails).
 *
 * The only hard stop is `prefers-reduced-motion`, which is an
 * accessibility requirement rather than a performance decision.
 */

export type Tier = "low" | "mid" | "high";

export interface Budget {
  tier: Tier;
  /** Frames per second the rAF scheduler aims for. */
  fps: number;
  /** Multiplier on particle/instance counts. */
  density: number;
  /** Multiplier on blur radii — blur is the most expensive paint op. */
  blur: number;
  /** Multiplier on animation distance/intensity. */
  amplitude: number;
  /** Cap on devicePixelRatio for canvas backing stores. */
  dpr: number;
  /** Whether heavy compositor effects (backdrop-filter, big shadows) run. */
  richEffects: boolean;
  /** Pointer-driven effects only make sense with a fine pointer. */
  pointerFX: boolean;
  reduceMotion: boolean;
}

interface Signals {
  cores: number;
  memory: number;
  dpr: number;
  width: number;
  finePointer: boolean;
  reduceMotion: boolean;
  saveData: boolean;
  slowNetwork: boolean;
}

function readSignals(): Signals {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const conn = nav.connection;

  return {
    cores: navigator.hardwareConcurrency || 4,
    // deviceMemory is Chromium-only; 4 GB is a safe neutral assumption.
    memory: nav.deviceMemory ?? 4,
    dpr: window.devicePixelRatio || 1,
    width: window.innerWidth,
    finePointer: window.matchMedia("(pointer: fine)").matches,
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: Boolean(conn?.saveData),
    slowNetwork: /(^|-)2g$/.test(conn?.effectiveType ?? ""),
  };
}

function scoreToTier(s: Signals): Tier {
  // Weighted score: CPU and memory dominate, since the bottleneck for
  // scroll-driven work is main-thread time rather than bandwidth.
  let score = 0;
  score += s.cores >= 8 ? 3 : s.cores >= 6 ? 2 : s.cores >= 4 ? 1 : 0;
  score += s.memory >= 8 ? 3 : s.memory >= 4 ? 2 : s.memory >= 2 ? 1 : 0;
  score += s.width >= 1280 ? 2 : s.width >= 768 ? 1 : 0;
  // A high DPR on a weak CPU is the worst case: many more pixels to paint.
  if (s.dpr > 2 && s.cores < 6) score -= 1;
  if (s.saveData || s.slowNetwork) score -= 2;

  if (score >= 6) return "high";
  if (score >= 3) return "mid";
  return "low";
}

const PRESETS: Record<Tier, Omit<Budget, "tier" | "pointerFX" | "reduceMotion">> = {
  // Everything still runs at low tier — just lighter.
  low: { fps: 30, density: 0.4, blur: 0.45, amplitude: 0.7, dpr: 1, richEffects: false },
  mid: { fps: 48, density: 0.7, blur: 0.75, amplitude: 0.9, dpr: 1.5, richEffects: true },
  high: { fps: 60, density: 1, blur: 1, amplitude: 1, dpr: 2, richEffects: true },
};

let cached: Budget | null = null;

export function getBudget(): Budget {
  if (cached) return cached;

  if (typeof window === "undefined") {
    // SSR: assume mid so server markup never encodes a device assumption.
    return { tier: "mid", ...PRESETS.mid, pointerFX: false, reduceMotion: false };
  }

  const s = readSignals();
  const tier = scoreToTier(s);

  cached = {
    tier,
    ...PRESETS[tier],
    dpr: Math.min(s.dpr, PRESETS[tier].dpr),
    pointerFX: s.finePointer,
    reduceMotion: s.reduceMotion,
  };
  return cached;
}

/**
 * Downgrades the budget when real frame times say the device can't keep up.
 * Called by the motion engine's watchdog — a mid-tier phone that thermally
 * throttles mid-session should quietly get lighter rather than stutter.
 */
export function downgrade(): Budget {
  const b = getBudget();
  if (b.tier === "low") return b;
  const tier: Tier = b.tier === "high" ? "mid" : "low";
  cached = {
    ...b,
    tier,
    ...PRESETS[tier],
    dpr: Math.min(b.dpr, PRESETS[tier].dpr),
  };
  return cached;
}

/** Publishes the budget to CSS so stylesheets can scale with it too. */
export function applyBudgetToCss(b: Budget = getBudget()) {
  const root = document.documentElement;
  root.dataset.tier = b.tier;
  root.style.setProperty("--fx-blur", String(b.blur));
  root.style.setProperty("--fx-amplitude", String(b.amplitude));
  root.style.setProperty("--fx-density", String(b.density));
}
