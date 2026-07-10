import Link from "next/link";
import AuthUserButton from "@/components/auth-user-button";
import GalleryGroupManager from "@/components/gallery-group-manager";
import TopNavigationTabs from "@/components/top-navigation-tabs";
import { getFavoriteGroupBySlug } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function FavoritesGroupPage({ params }) {
  const { groupSlug } = await params;
  const group = await getFavoriteGroupBySlug(groupSlug);

  if (!group) {
    return (
      <main className="page-shell detail-page">
        <div className="missing-state">
          <p className="eyebrow">Missing Group</p>
          <h1>This favorites block could not be found.</h1>
          <Link className="back-link" href="/favorites">
            Return to favorites
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell detail-page group-page">
      <div className="topbar">
        <span className="topbar-mark">Private Library</span>
        <AuthUserButton />
      </div>

      <TopNavigationTabs activeTab="favorites" />

      <div className="detail-body">
        <header className="detail-hero">
          <div>
            <Link className="back-link" href="/favorites">
              Back to favorites
            </Link>
            <h1>{group.title}</h1>
          </div>
        </header>

        <GalleryGroupManager
          collectionHref={`/favorites/${groupSlug}`}
          group={group}
          emptyRedirectHref="/favorites"
          note="Tap the heart on a cover to remove it from favorites, or use Edit to delete a set."
        />
      </div>
    </main>
  );
}
