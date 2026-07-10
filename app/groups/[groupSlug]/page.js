import Link from "next/link";
import AuthUserButton from "@/components/auth-user-button";
import GalleryGroupManager from "@/components/gallery-group-manager";
import TopNavigationTabs from "@/components/top-navigation-tabs";
import { getGalleryGroupBySlug } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function GalleryGroupPage({ params }) {
  const { groupSlug } = await params;
  const group = await getGalleryGroupBySlug(groupSlug);

  if (!group) {
    return (
      <main className="page-shell detail-page">
        <div className="missing-state">
          <p className="eyebrow">Missing Group</p>
          <h1>This group could not be found.</h1>
          <Link className="back-link" href="/">
            Return home
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

      <TopNavigationTabs activeTab="all" />

      <div className="detail-body">
        <header className="detail-hero">
          <div>
            <Link className="back-link" href="/">
              Back to all galleries
            </Link>
            <h1>{group.title}</h1>
          </div>
        </header>

        <GalleryGroupManager
          collectionHref={`/groups/${groupSlug}`}
          group={group}
        />
      </div>
    </main>
  );
}
