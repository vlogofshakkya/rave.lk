"use client";

import { useEffect, useRef } from "react";
import { engine, damp, lerp } from "@/lib/motion-engine";

/**
 * LIGHTING ENGINE
 *
 * A fixed canvas behind the page that simulates a festival lighting rig:
 * moving-head beams that sweep, a haze wash, and strobe accents that fire
 * on fast scrolling. It is the "EDM feel" layer — scroll harder and the
 * rig responds like an operator riding the faders.
 *
 * Runs on every device. The Optimize Engine only scales beam count, blur
 * and canvas resolution — the choreography is identical everywhere.
 */

interface Beam {
  x: number;          // anchor across the top, 0..1
  angle: number;      // current angle in radians
  targetAngle: number;
  speed: number;
  width: number;
  hue: number;
  phase: number;
}

const PALETTE = [
  75,   // acid lime
  266,  // ultraviolet
  330,  // hot pink
  190,  // cyan
];

export default function LightingRig() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const budget = engine.getBudget();
    if (budget.reduceMotion) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Beam count scales with the budget but never reaches zero.
    const count = Math.max(3, Math.round(7 * budget.density));
    const beams: Beam[] = Array.from({ length: count }, (_, i) => ({
      x: (i + 0.5) / count,
      angle: 0,
      targetAngle: 0,
      speed: 0.35 + Math.random() * 0.5,
      width: 0.06 + Math.random() * 0.09,
      hue: PALETTE[i % PALETTE.length],
      phase: Math.random() * Math.PI * 2,
    }));

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, budget.dpr);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    let strobe = 0;
    let intensity = 0;

    const unsubscribe = engine.subscribe(({ time, dt, velocity, progress, budget: b }) => {
      // Energy tracks scroll velocity with a slow decay, so the rig keeps
      // glowing for a moment after you stop — like real lights easing off.
      intensity = lerp(intensity, 0.25 + velocity * 0.75, damp(3, dt));

      // Strobe fires on hard scrolls only.
      if (velocity > 0.75 && strobe <= 0) strobe = 1;
      strobe = Math.max(0, strobe - dt * 5);

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // Beams
      for (const beam of beams) {
        beam.targetAngle =
          Math.sin(time * beam.speed * 0.5 + beam.phase) * 0.55 +
          progress * 0.35;
        beam.angle = lerp(beam.angle, beam.targetAngle, damp(2, dt));

        const originX = beam.x * w;
        const originY = -h * 0.06;
        const length = h * 1.35;
        const spread = beam.width * w * (0.7 + intensity * 0.6) * b.amplitude;

        const endX = originX + Math.sin(beam.angle) * length;
        const endY = originY + Math.cos(beam.angle) * length;

        const grad = ctx.createLinearGradient(originX, originY, endX, endY);
        const alpha = (0.05 + intensity * 0.16) * b.amplitude;
        grad.addColorStop(0, `hsla(${beam.hue}, 100%, 62%, ${alpha})`);
        grad.addColorStop(0.55, `hsla(${beam.hue}, 100%, 55%, ${alpha * 0.4})`);
        grad.addColorStop(1, `hsla(${beam.hue}, 100%, 50%, 0)`);

        // Cone shape, widening away from the head.
        const perpX = Math.cos(beam.angle);
        const perpY = -Math.sin(beam.angle);
        ctx.beginPath();
        ctx.moveTo(originX - perpX * spread * 0.12, originY - perpY * spread * 0.12);
        ctx.lineTo(originX + perpX * spread * 0.12, originY + perpY * spread * 0.12);
        ctx.lineTo(endX + perpX * spread, endY + perpY * spread);
        ctx.lineTo(endX - perpX * spread, endY - perpY * spread);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Lens glow at the head — skipped only when blur is cheap-tier,
        // where the cone alone reads correctly.
        if (b.richEffects) {
          const glow = ctx.createRadialGradient(
            originX, originY + h * 0.02, 0,
            originX, originY + h * 0.02, 90 * b.blur
          );
          glow.addColorStop(0, `hsla(${beam.hue}, 100%, 70%, ${0.18 * intensity})`);
          glow.addColorStop(1, "hsla(0,0%,0%,0)");
          ctx.fillStyle = glow;
          ctx.fillRect(originX - 100, originY - 40, 200, 200);
        }
      }

      // Strobe flash
      if (strobe > 0.01) {
        ctx.fillStyle = `rgba(242,240,235,${strobe * 0.05})`;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.globalCompositeOperation = "source-over";
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-70"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
