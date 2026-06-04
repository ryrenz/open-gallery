import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { CLERK_ENABLED } from "@/lib/auth-config";
import { verifyInviteCookieValue } from "@/lib/invite-token";

const INVITE_COOKIE = "og_invite";

const isProtectedRoute = createRouteMatcher([
  "/",
  "/gallery(.*)",
  "/groups(.*)",
  "/artists(.*)",
  "/favorites(.*)",
  "/api/media(.*)",
  "/api/galleries(.*)",
  "/api/likes(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isSignUpRoute = createRouteMatcher(["/sign-up(.*)"]);
const isInviteRoute = createRouteMatcher(["/invite(.*)", "/api/invite(.*)", "/sign-in(.*)"]);


async function hasValidInviteCookie(req) {
  const cookieValue = req.cookies.get(INVITE_COOKIE)?.value;
  if (!cookieValue) return false;
  return verifyInviteCookieValue(cookieValue);
}

function isInviteEnabled() {
  return Boolean(process.env.ADMIN_USER_ID);
}

function isAdmin(userId) {
  const adminId = process.env.ADMIN_USER_ID;
  return Boolean(adminId && userId === adminId);
}

const handleClerk = clerkMiddleware(async (auth, req) => {
  if (isInviteRoute(req)) {
    return NextResponse.next();
  }

  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!userId || !isAdmin(userId)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (isSignUpRoute(req)) {
    if (isInviteEnabled()) {
      const { userId } = await auth();
      if (!userId && !(await hasValidInviteCookie(req))) {
        return NextResponse.redirect(new URL("/invite", req.url));
      }
    }
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function proxy(req, event) {
  if (!CLERK_ENABLED) {
    return NextResponse.next();
  }

  return handleClerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
