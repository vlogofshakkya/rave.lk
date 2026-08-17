import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import GalleryGrid from "@/components/site/GalleryGrid";
import { getGallery, getGalleryCategories } from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos from Rave.LK events across Sri Lanka — crowds, stages, artists and sunrise sets.",
};

export default async function GalleryPage() {
  const [items, categories] = await Promise.all([
    getGallery({ limit: 200 }),
    getGalleryCategories(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={`${items.length} frames`}
        title="Gallery"
        copy="Shot live on the floor. Filter by what you want to see, then tap any frame to open it."
      />
      <section className="shell py-14 md:py-20">
        <GalleryGrid items={items} categories={categories} />
      </section>
    </>
  );
}
