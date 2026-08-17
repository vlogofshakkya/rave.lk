import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-void px-6 text-center">
      <div>
        <p className="eyebrow mb-5">Error 404</p>
        <h1 className="display-xl mb-6 text-bone">
          Wrong
          <br />
          <span className="text-lime">room</span>
        </h1>
        <p className="mx-auto mb-9 max-w-sm text-sm leading-relaxed text-smoke">
          This page doesn&apos;t exist. The dancefloor is back that way.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-lime cut-corner">
            Back home
          </Link>
          <Link href="/events" className="btn btn-ghost cut-corner">
            See events
          </Link>
        </div>
      </div>
    </div>
  );
}
