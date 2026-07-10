import Link from "next/link";
import AuthUserButton from "@/components/auth-user-button";
import ImageStrip from "@/components/image-strip";
import LikeButton from "@/components/like-button";
import WorkNavigator from "@/components/work-navigator";
import { getGalleryBySlug, getGalleryNavigation } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function GalleryDetailPage({ params }) {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);
  const navigation = gallery ? await getGalleryNavigation(slug) : null;

  if (!gallery) {
    return (
      <main className="page-shell detail-page">
        <div className="missing-state">
          <p className="eyebrow">Missing Gallery</p>
          <h1>This set could not be found.</h1>
          <Link className="back-link" href="/">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell detail-page">
      <div className="topbar">
        <span className="topbar-mark">Private Library</span>
        <AuthUserButton />
      </div>
      <div className="detail-body">
        <header className="detail-hero">
          <div>
            <div className="detail-back-row">
              <Link className="back-link" href="/">
                Back to covers
              </Link>
              {navigation ? (
                <Link
                  className="back-link"
                  href={`/groups/${navigation.groupSlug}`}
                >
                  Back to {navigation.groupTitle}
                </Link>
              ) : null}
            </div>
            <div className="detail-title-row">
              <h1>{gallery.title}</h1>
              {gallery.artistName ? (
                <Link
                  className="detail-artist"
                  href={`/artists/${gallery.artistSlug}`}
                >
                  {gallery.artistName}
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <div className="detail-reader">
          <ImageStrip gallery={gallery} />
        </div>

        {navigation && navigation.works.length > 1 ? (
          <WorkNavigator navigation={navigation} />
        ) : null}
      </div>

      <LikeButton slug={gallery.slug} title={gallery.title} variant="floating" />
    </main>
  );
}
