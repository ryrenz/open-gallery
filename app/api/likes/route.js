import { getLikedCurrentSlugs, likeGalleryBySlug } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export async function GET() {
  const likes = await getLikedCurrentSlugs();
  return Response.json({ likes });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (!slug) {
    return Response.json({ error: "Missing slug." }, { status: 400 });
  }

  const liked = Boolean(body.liked);

  try {
    const result = await likeGalleryBySlug(slug, liked);

    if (!result) {
      return Response.json({ error: "Gallery not found." }, { status: 404 });
    }

    return Response.json({ ok: true, slug: result.slug, liked: result.liked });
  } catch {
    return Response.json(
      { error: "Unable to save like right now." },
      { status: 500 },
    );
  }
}
