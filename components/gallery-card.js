import Link from "next/link";
import LikeButton from "@/components/like-button";
import RetryImage from "@/components/retry-image";

export function GalleryCard({
  gallery,
  href = `/gallery/${gallery.slug}`,
  interactive = true,
  overlayAction = null,
  prefetch = true,
  showLike = true,
}) {
  const cardBody = (
    <>
      <div className="cover-frame">
        <RetryImage
          alt={gallery.title}
          loading="lazy"
          src={`/api/media/${gallery.slug}/${gallery.coverIndex}?mode=cover&w=560&q=70`}
        />
        {showLike ? (
          <div className="gallery-card-like">
            <LikeButton slug={gallery.slug} title={gallery.title} variant="card" />
          </div>
        ) : null}
        {overlayAction ? (
          <div className="gallery-card-action">{overlayAction}</div>
        ) : null}
        <div className="cover-overlay">
          <span className="cover-chip">{gallery.imageCount} pics</span>
        </div>
      </div>
      <div className="gallery-info">
        <h3 className="gallery-title">{gallery.title}</h3>
      </div>
    </>
  );

  return (
    <article className={`gallery-card${interactive ? "" : " gallery-card-static"}`}>
      {interactive ? (
        <Link href={href} prefetch={prefetch}>
          {cardBody}
        </Link>
      ) : cardBody}
    </article>
  );
}
