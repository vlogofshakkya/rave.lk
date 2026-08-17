import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import ContactForm from "@/components/site/ContactForm";
import { getSettings } from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Rave.LK — bookings, artist submissions, press and brand partnerships.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  const channels = [
    settings.contact_email && {
      label: "Email",
      value: settings.contact_email,
      href: `mailto:${settings.contact_email}`,
    },
    settings.contact_phone && {
      label: "Phone",
      value: settings.contact_phone,
      href: `tel:${settings.contact_phone.replace(/\s/g, "")}`,
    },
    settings.whatsapp_number && {
      label: "WhatsApp",
      value: settings.whatsapp_number,
      href: `https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}`,
    },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  const socials = [
    ["Instagram", settings.instagram_url],
    ["Facebook", settings.facebook_url],
    ["TikTok", settings.tiktok_url],
    ["YouTube", settings.youtube_url],
  ].filter(([, u]) => Boolean(u)) as [string, string][];

  return (
    <>
      <PageHeader
        eyebrow="Say hello"
        title="Contact"
        copy="Bookings, artist submissions, press or partnerships — pick whichever line suits and we'll come back to you."
      />

      <section className="shell grid gap-14 py-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20 md:py-20">
        {/* Channels */}
        <div>
          <h2 data-reveal="up" className="display-md mb-8 text-bone">
            Direct lines
          </h2>

          <ul data-reveal-group data-stagger="90" className="space-y-5">
            {channels.map((c) => (
              <li key={c.label} data-reveal="up" className="border-t border-bone/12 pt-4">
                <p className="label-mono mb-2">{c.label}</p>
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noreferrer noopener" : undefined}
                  className="link-sweep text-lg text-bone transition-colors hover:text-lime"
                >
                  {c.value}
                </a>
              </li>
            ))}

            <li data-reveal="up" className="border-t border-bone/12 pt-4">
              <p className="label-mono mb-2">Based in</p>
              <p className="text-lg text-bone">Colombo, Sri Lanka</p>
            </li>
          </ul>

          {socials.length > 0 && (
            <div data-reveal="fade" className="mt-10">
              <p className="label-mono mb-4">Follow</p>
              <div className="flex flex-wrap gap-2">
                {socials.map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="cut-corner-sm border border-bone/15 px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] text-smoke uppercase transition-colors duration-300 hover:border-lime hover:bg-lime hover:text-void"
                  >
                    {name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div data-reveal="up" className="cut-corner border border-bone/12 bg-void-2 p-6 md:p-8">
          <h2 className="display-md mb-2 text-bone">Send a message</h2>
          <p className="mb-8 text-sm text-smoke">
            We read everything and reply within two working days.
          </p>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
