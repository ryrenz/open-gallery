import Link from "next/link";
import CoverCollage from "@/components/cover-collage";

export function GalleryGroupCard({ group, hrefPrefix = "/groups" }) {
  // One cover per character (its newest work); fall back to all works.
  const covers = group.coverGalleries ?? group.galleries;

  return (
    <article className="gallery-card gallery-group-card">
      <Link href={`${hrefPrefix}/${group.slug}`}>
        <div className="cover-frame group-cover-frame">
          <CoverCollage covers={covers} quality={62} width={280} />
        </div>
        <div className="gallery-info">
          <h3 className="gallery-title">{group.title}</h3>
        </div>
      </Link>
    </article>
  );
}
