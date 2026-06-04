import Link from "next/link";

export default function ArtistCard({ artist }) {
  const covers = artist.previewGalleries;
  const columns = Math.max(1, Math.ceil(Math.sqrt(covers.length)));
  const rows = Math.max(1, Math.ceil(covers.length / columns));

  return (
    <article className="gallery-card artist-card">
      <Link href={`/artists/${artist.slug}`}>
        <div className="cover-frame artist-cover-frame">
          <div
            className="artist-cover-grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {covers.map((gallery) => (
              <img
                alt={gallery.title}
                className="artist-cover-tile"
                key={gallery.slug}
                loading="lazy"
                src={`/api/media/${gallery.slug}/${gallery.coverIndex}?mode=cover&w=320&q=64`}
              />
            ))}
          </div>
        </div>
        <div className="gallery-info artist-card-info">
          <h3 className="gallery-title">{artist.title}</h3>
        </div>
      </Link>
    </article>
  );
}
