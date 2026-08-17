import Image from "next/image";
import Link from "next/link";
import Marquee from "@/components/motion/Marquee";
import NewsletterForm from "./NewsletterForm";
import type { Settings } from "@/lib/types";

const SITEMAP = [
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/tickets", label: "Tickets" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Footer({ settings }: { settings: Settings }) {
  const socials = [
    ["Instagram", settings.instagram_url],
    ["Facebook", settings.facebook_url],
    ["TikTok", settings.tiktok_url],
    ["YouTube", settings.youtube_url],
  ].filter(([, url]) => Boolean(url)) as [string, string][];

  return (
    <footer className="relative z-10 mt-auto overflow-hidden border-t border-bone/10 bg-void">
      {/* Scrolling brand band */}
      <div className="border-b border-bone/10 py-5">
        <Marquee duration={26}>
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8 pr-8">
              <span className="display-md text-bone/12">RAVE.LK</span>
              <span className="h-1.5 w-1.5 rotate-45 bg-lime" />
              <span className="display-md text-bone/12">FEEL THE FREQUENCY</span>
              <span className="h-1.5 w-1.5 rotate-45 bg-lime" />
            </span>
          ))}
        </Marquee>
      </div>

      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <Image
              src="/brand/logo.png"
              alt="Rave.LK"
              width={1600}
              height={234}
              className="h-6 w-auto"
            />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-smoke">
              {settings.site_tagline || "Sri Lanka's Electronic Music Movement"}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="cut-corner-sm border border-bone/15 px-4 py-2 font-mono text-[10px] tracking-[0.16em] text-smoke uppercase transition-colors duration-300 hover:border-lime hover:bg-lime hover:text-void"
                >
                  {name}
                </a>
              ))}
            </div>
          </div>

          {/* Sitemap */}
          <nav>
            <h3 className="label-mono mb-5">Explore</h3>
            <ul className="space-y-3">
              {SITEMAP.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="link-sweep text-sm text-bone/75 transition-colors hover:text-lime"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="label-mono mb-5">Reach us</h3>
            <ul className="space-y-3 text-sm">
              {settings.contact_email && (
                <li>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="link-sweep text-bone/75 transition-colors hover:text-lime"
                  >
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li>
                  <a
                    href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                    className="link-sweep text-bone/75 transition-colors hover:text-lime"
                  >
                    {settings.contact_phone}
                  </a>
                </li>
              )}
              <li className="text-smoke">Colombo, Sri Lanka</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="label-mono mb-5">On the list</h3>
            <p className="mb-4 text-sm text-smoke">
              Lineups and presale codes, before they go public.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-bone/10">
        <div className="shell flex flex-col items-center justify-between gap-3 py-6 text-center md:flex-row md:text-left">
          <p className="font-mono text-[10px] tracking-[0.16em] text-smoke uppercase">
            © {new Date().getFullYear()} Rave.LK — All rights reserved
          </p>
          <p className="font-mono text-[10px] tracking-[0.16em] text-smoke uppercase">
            Developed by{" "}
            <a
              href="https://lankanova.lk"
              target="_blank"
              rel="noreferrer noopener"
              className="link-sweep font-bold text-lime transition-opacity hover:opacity-80"
            >
              LankaNova Digital Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
