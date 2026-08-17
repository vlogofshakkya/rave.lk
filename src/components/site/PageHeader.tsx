export default function PageHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <header className="relative overflow-hidden border-b border-bone/10 pt-[calc(var(--nav-h)+4rem)] pb-14 md:pt-[calc(var(--nav-h)+6rem)] md:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/4 h-[45vh] w-[45vh] rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, #6b2bff, transparent 70%)" }}
      />
      <div className="shell relative">
        <p data-reveal="fade" className="eyebrow mb-4">
          {eyebrow}
        </p>
        <h1 data-reveal="up" className="display-xl text-bone">
          {title}
        </h1>
        {copy && (
          <p
            data-reveal="up"
            className="mt-6 max-w-xl text-sm leading-relaxed text-smoke"
          >
            {copy}
          </p>
        )}
      </div>
    </header>
  );
}
