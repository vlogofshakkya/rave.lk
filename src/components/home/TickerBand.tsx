import Marquee from "@/components/motion/Marquee";

const PHRASES = [
  "BASS THAT MOVES ISLANDS",
  "SUNRISE SETS",
  "WAREHOUSE TECHNO",
  "MAIN STAGE MADNESS",
  "BEACH RAVES",
];

export default function TickerBand() {
  return (
    <section className="relative border-y border-bone/10 bg-lime py-4 md:py-5">
      <Marquee duration={22}>
        {PHRASES.map((p, i) => (
          <span key={i} className="flex items-center gap-6 pr-6 md:gap-10 md:pr-10">
            <span className="font-display text-xl whitespace-nowrap text-void md:text-3xl">
              {p}
            </span>
            <span className="h-2 w-2 shrink-0 rotate-45 bg-void" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}
