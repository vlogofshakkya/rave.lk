"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Magnetic from "@/components/motion/Magnetic";
import { engine } from "@/lib/motion-engine";

const LINKS = [
  { href: "/", label: "Home", index: "01" },
  { href: "/events", label: "Events", index: "02" },
  { href: "/gallery", label: "Gallery", index: "03" },
  { href: "/tickets", label: "Tickets", index: "04" },
  { href: "/about", label: "About", index: "05" },
  { href: "/contact", label: "Contact", index: "06" },
];

const DESKTOP_LINKS = LINKS.slice(1, 5);

export default function Nav({ socials }: { socials: Record<string, string> }) {
  // Keying on the route remounts the bar on navigation, which closes the
  // overlay without a setState-in-effect cascade.
  const pathname = usePathname();
  return <NavBar key={pathname} socials={socials} pathname={pathname} />;
}

function NavBar({
  socials,
  pathname,
}: {
  socials: Record<string, string>;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  // Mirrors `open` for the scroll subscriber, which is created once and
  // must not close over a stale value.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Hide on scroll-down, reveal on scroll-up — from the shared loop.
  useEffect(() => {
    let lastY = window.scrollY;
    return engine.subscribe(({ scroll }) => {
      setSolid(scroll > 40);
      if (!openRef.current) {
        setHidden(scroll > lastY && scroll > 240);
      }
      lastY = scroll;
    });
  }, []);

  // Lock scrolling while the overlay is open.
  useEffect(() => {
    const lenis = window.__lenis;
    if (open) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* ── Overlay ───────────────────────────────────────────
          Rendered before the header and at a lower z-index, so the header
          (logo + close button) always stays on top of it. */}
      <div
        className={[
          "fixed inset-0 z-[95] transition-[clip-path] duration-[850ms]",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        style={{
          clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
          transitionTimingFunction: "cubic-bezier(0.76,0,0.24,1)",
        }}
        aria-hidden={!open}
      >
        <div className="relative flex h-full flex-col overflow-y-auto bg-void">
          {/* UV wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-1/4 left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
            style={{ background: "radial-gradient(circle,#6b2bff 0%,transparent 70%)" }}
          />

          {/* pt clears the fixed header so the first link never collides
              with the logo. */}
          <div className="shell relative z-10 flex min-h-full flex-col justify-center pt-[calc(var(--nav-h)+3rem)] pb-16">
            <ul className="flex flex-col">
              {LINKS.map((l, i) => {
                const active = pathname === l.href;
                return (
                  <li key={l.href} className="overflow-hidden border-b border-bone/10">
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      tabIndex={open ? 0 : -1}
                      className="group flex items-baseline gap-4 py-3.5 md:gap-8 md:py-5"
                      style={{
                        transform: open ? "translateY(0)" : "translateY(110%)",
                        opacity: open ? 1 : 0,
                        transition: `transform 0.85s cubic-bezier(0.16,1,0.3,1) ${i * 55 + 120}ms, opacity 0.5s ease ${i * 55 + 120}ms`,
                      }}
                    >
                      <span className="font-mono text-[10px] tracking-[0.2em] text-lime/70">
                        {l.index}
                      </span>
                      <span
                        className={[
                          "display-lg transition-[color,transform] duration-500 group-hover:translate-x-3",
                          active ? "text-lime" : "text-bone group-hover:text-lime",
                        ].join(" ")}
                        style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
                      >
                        {l.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3"
              style={{ opacity: open ? 1 : 0, transition: "opacity 0.5s ease 520ms" }}
            >
              {Object.entries(socials)
                .filter(([, url]) => url)
                .map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    tabIndex={open ? 0 : -1}
                    className="link-sweep font-mono text-[11px] tracking-[0.18em] text-smoke uppercase transition-colors hover:text-lime"
                  >
                    {name}
                  </a>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Header ────────────────────────────────────────────── */}
      <header
        className={[
          "fixed inset-x-0 top-0 z-[100] transition-[transform,background-color,border-color,backdrop-filter] duration-500",
          hidden ? "-translate-y-full" : "translate-y-0",
          solid && !open
            ? "border-b border-bone/10 bg-void/80 backdrop-blur-xl"
            : "border-b border-transparent",
        ].join(" ")}
        style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="shell flex h-[var(--nav-h)] items-center justify-between gap-6">
          <Link href="/" aria-label="Rave.LK home" className="group flex items-center">
            <Image
              src="/brand/logo.png"
              alt="Rave.LK"
              width={1600}
              height={234}
              priority
              className="h-4 w-auto transition-transform duration-500 group-hover:scale-105 md:h-5"
              style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
            />
          </Link>

          {/* Inline links hide while the overlay is open so they can't
              bleed through it. */}
          <nav
            className={[
              "hidden items-center gap-9 transition-opacity duration-300 lg:flex",
              open ? "pointer-events-none opacity-0" : "opacity-100",
            ].join(" ")}
          >
            {DESKTOP_LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  tabIndex={open ? -1 : 0}
                  className={[
                    "link-sweep font-mono text-[11px] tracking-[0.18em] uppercase transition-colors duration-300",
                    active ? "text-lime" : "text-bone/70 hover:text-bone",
                  ].join(" ")}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Magnetic strength={0.25} className="hidden sm:inline-block">
              <Link
                href="/tickets"
                tabIndex={open ? -1 : 0}
                className={[
                  "btn btn-lime cut-corner-sm !px-6 !py-3 transition-opacity duration-300",
                  open ? "pointer-events-none opacity-0" : "opacity-100",
                ].join(" ")}
              >
                Get Tickets
              </Link>
            </Magnetic>

            {/* Single toggle for all breakpoints — the old build had two
                overlapping buttons, which is why the label read "CLMENUE". */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              data-cursor={open ? "Close" : "Menu"}
              className="flex h-11 items-center gap-2.5 border border-bone/20 px-3.5 font-mono text-[10px] tracking-[0.18em] uppercase transition-colors duration-300 hover:border-lime hover:text-lime md:px-4"
            >
              <span className="hidden w-[2.6rem] text-left sm:inline-block">
                {open ? "Close" : "Menu"}
              </span>
              <span className="relative block h-3 w-4">
                <span
                  className="absolute left-0 block h-px w-full bg-current transition-all duration-400"
                  style={{
                    top: open ? "50%" : "2px",
                    transform: open ? "rotate(45deg)" : "none",
                    transitionTimingFunction: "cubic-bezier(0.76,0,0.24,1)",
                  }}
                />
                <span
                  className="absolute left-0 block h-px w-full bg-current transition-all duration-400"
                  style={{
                    bottom: open ? "50%" : "2px",
                    transform: open ? "rotate(-45deg) translateY(-0.5px)" : "none",
                    transitionTimingFunction: "cubic-bezier(0.76,0,0.24,1)",
                  }}
                />
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
