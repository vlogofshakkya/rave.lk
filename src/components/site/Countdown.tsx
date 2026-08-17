"use client";

import { useEffect, useState } from "react";
import { countdownParts } from "@/lib/utils";
import { useMounted } from "@/lib/useMounted";

export default function Countdown({ target }: { target: string }) {
  const mounted = useMounted();
  const [cd, setCd] = useState(() => countdownParts(target));

  useEffect(() => {
    const id = setInterval(() => setCd(countdownParts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (cd.expired) {
    return (
      <p className="font-mono text-[11px] tracking-[0.18em] text-lime uppercase">
        Happening now
      </p>
    );
  }

  const cells = [
    ["Days", cd.days],
    ["Hours", cd.hours],
    ["Minutes", cd.minutes],
    ["Seconds", cd.seconds],
  ] as const;

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {cells.map(([label, value]) => (
        <div
          key={label}
          className="cut-corner-sm min-w-[4.5rem] border border-bone/12 bg-void/60 px-4 py-3 text-center backdrop-blur-sm md:min-w-[5.5rem]"
        >
          <div className="font-display text-3xl leading-none text-lime tabular-nums md:text-4xl">
            {mounted ? String(value).padStart(2, "0") : "--"}
          </div>
          <div className="mt-1.5 font-mono text-[9px] tracking-[0.16em] text-smoke uppercase">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
