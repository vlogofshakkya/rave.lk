import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import MotionProvider from "@/components/motion/MotionProvider";
import LightingRig from "@/components/motion/LightingRig";
import Cursor from "@/components/motion/Cursor";
import ScrollSpine from "@/components/motion/ScrollSpine";
import Preloader from "@/components/motion/Preloader";
import KeepAlive from "@/components/site/KeepAlive";
import { getSettings } from "@/lib/queries";

// Settings change from the CMS; revalidate rather than cache forever.
export const revalidate = 60;

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  const socials = {
    Instagram: settings.instagram_url ?? "",
    Facebook: settings.facebook_url ?? "",
    TikTok: settings.tiktok_url ?? "",
    YouTube: settings.youtube_url ?? "",
  };

  return (
    <>
      <Preloader />
      <KeepAlive />
      <MotionProvider />
      <LightingRig />
      <Cursor />
      <ScrollSpine />
      <Nav socials={socials} />
      {/* Sits above the fixed lighting canvas. */}
      <main className="relative z-10 flex-1">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
