import Link from "next/link";
import RetryImage from "@/components/retry-image";

export function GalleryGroupCard({ group, hrefPrefix = "/groups" }) {
  // One cover per character (its newest work); fall back to all works for older
  // callers. Lay them out in a balanced grid that fills the frame.
  const covers = group.coverGalleries ?? group.galleries;
  const columns = Math.max(1, Math.ceil(Math.sqrt(covers.length)));
  const rows = Math.max(1, Math.ceil(covers.length / columns));

  return (
    <article className="gallery-card gallery-group-card">
      <Link href={`${hrefPrefix}/${group.slug}`}>
        <div className="cover-frame group-cover-frame">
          <div
            className="group-cover-grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {covers.map((gallery) => (
              <RetryImage
                alt={gallery.title}
                className="group-cover-tile"
                key={gallery.slug}
                loading="lazy"
                src={`/api/media/${gallery.slug}/${gallery.coverIndex}?mode=cover&w=280&q=62`}
              />
            ))}
          </div>
        </div>
        <div className="gallery-info">
          <h3 className="gallery-title">{group.title}</h3>
        </div>
      </Link>
    </article>
  );
}
