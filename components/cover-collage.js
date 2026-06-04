import RetryImage from "@/components/retry-image";
import { coverRowSizes } from "@/lib/cover-layout";

// Renders cover tiles in flex rows that always fill the frame with no gaps —
// composite counts form an even grid, primes split into balanced rows whose
// shorter row stretches to fill. See lib/cover-layout.js.
export default function CoverCollage({ covers, width, quality }) {
  const rowSizes = coverRowSizes(covers.length);
  let offset = 0;

  return (
    <div className="cover-collage">
      {rowSizes.map((size, rowIndex) => {
        const rowCovers = covers.slice(offset, offset + size);
        offset += size;

        return (
          <div className="cover-collage-row" key={rowIndex}>
            {rowCovers.map((gallery) => (
              <RetryImage
                alt={gallery.title}
                className="cover-collage-tile"
                key={gallery.slug}
                loading="lazy"
                src={`/api/media/${gallery.slug}/${gallery.coverIndex}?mode=cover&w=${width}&q=${quality}`}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
