import { cookies } from "next/headers";
import { consumeInviteCode } from "@/lib/invite-store";
import { buildInviteCookieValue } from "@/lib/invite-token";

export const dynamic = "force-dynamic";

const INVITE_COOKIE = "og_invite";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Best-effort in-memory rate limit to slow down invite-code brute force.
// Per-worker only (not shared across Next workers); a global limiter would
// need KV/Redis, which is out of scope here.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const attempts = new Map();

function getClientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { code } = body;

  if (typeof code !== "string" || !code.trim()) {
    return Response.json({ error: "Invite code is required." }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();
  const valid = await consumeInviteCode(normalizedCode);

  if (!valid) {
    return Response.json({ error: "Invalid or already used invite code." }, { status: 401 });
  }

  const token = await buildInviteCookieValue(normalizedCode);
  const cookieStore = await cookies();

  cookieStore.set(INVITE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  return Response.json({ ok: true });
}
