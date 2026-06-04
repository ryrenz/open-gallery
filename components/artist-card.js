import Link from "next/link";
import CoverCollage from "@/components/cover-collage";

export default function ArtistCard({ artist }) {
  return (
    <article className="gallery-card artist-card">
      <Link href={`/artists/${artist.slug}`}>
        <div className="cover-frame artist-cover-frame">
          <CoverCollage covers={artist.previewGalleries} quality={64} width={320} />
        </div>
        <div className="gallery-info artist-card-info">
          <h3 className="gallery-title">{artist.title}</h3>
        </div>
      </Link>
    </article>
  );
}
