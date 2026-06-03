import Link from "next/link";
import AuthUserButton from "@/components/auth-user-button";
import ProgressiveGroupGrid from "@/components/progressive-group-grid";
import TopNavigationTabs from "@/components/top-navigation-tabs";
import { getFavoriteGroups } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const groups = await getFavoriteGroups();
  const totalSets = groups.reduce((total, group) => total + group.galleryCount, 0);

  return (
    <main className="page-shell home-page">
      <div className="topbar">
        <span className="topbar-mark">Open Gallery</span>
        <AuthUserButton />
      </div>

      <TopNavigationTabs activeTab="favorites" />

      <header className="section-heading">
        <div>
          <p className="eyebrow">Favorites</p>
          <h2>Every set you have liked</h2>
        </div>
        <p className="detail-description">
          {totalSets} liked {totalSets === 1 ? "set is" : "sets are"} grouped into{" "}
          {groups.length} {groups.length === 1 ? "block" : "blocks"}, ten per block.
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="missing-state">
          <p className="eyebrow">No Favorites Yet</p>
          <h1>Tap the heart on any set to save it here.</h1>
          <Link className="back-link" href="/">
            Browse galleries
          </Link>
        </div>
      ) : (
        <ProgressiveGroupGrid groups={groups} hrefPrefix="/favorites" />
      )}
    </main>
  );
}
