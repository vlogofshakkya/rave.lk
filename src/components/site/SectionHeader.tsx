import Link from "next/link";

export default function SectionHeader({
  eyebrow,
  title,
  copy,
  href,
  hrefLabel = "View all",
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
      <div className="max-w-2xl">
        <p data-reveal="fade" className="eyebrow mb-4">
          {eyebrow}
        </p>
        <h2 data-reveal="up" className="display-lg text-bone">
          {title}
        </h2>
        {copy && (
          <p data-reveal="up" className="mt-5 max-w-lg text-sm leading-relaxed text-smoke">
            {copy}
          </p>
        )}
      </div>

      {href && (
        <Link
          data-reveal="fade"
          href={href}
          className="link-sweep font-mono text-[11px] tracking-[0.18em] text-bone/70 uppercase transition-colors hover:text-lime"
        >
          {hrefLabel} →
        </Link>
      )}
    </div>
  );
}
