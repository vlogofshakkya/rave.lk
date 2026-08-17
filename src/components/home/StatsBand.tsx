import Counter from "@/components/motion/Counter";

export default function StatsBand({
  stats,
}: {
  stats: { events: number; pastEvents: number; photos: number; attendance: number };
}) {
  const items = [
    { label: "Events staged", value: stats.events, suffix: "+" },
    { label: "Ravers hosted", value: stats.attendance || 25000, suffix: "+" },
    { label: "Photos shot", value: stats.photos, suffix: "" },
    { label: "Hours of sound", value: 480, suffix: "+" },
  ];

  return (
    <section className="border-y border-bone/10 bg-void-2">
      <div
        className="shell grid grid-cols-2 divide-bone/10 lg:grid-cols-4 lg:divide-x"
        data-reveal-group
        data-stagger="110"
      >
        {items.map((s) => (
          <div
            key={s.label}
            data-reveal="up"
            className="border-b border-bone/10 px-2 py-10 text-center lg:border-b-0 lg:py-14"
          >
            <div className="font-display text-4xl leading-none text-lime tabular-nums md:text-6xl">
              <Counter to={s.value} suffix={s.suffix} />
            </div>
            <p className="mt-3 font-mono text-[10px] tracking-[0.18em] text-smoke uppercase">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
