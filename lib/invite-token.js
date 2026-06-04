// Invite cookie token, shared by the Edge middleware (proxy.js) and the
// validate route. Uses Web Crypto only (no node:crypto) so it runs on Edge.
//
// The cookie value is bound to the specific invite code:
//   `${encodeURIComponent(code)}.${HMAC(secret, code)}`
// so a leaked cookie only represents one code (not a single master token that
// unlocks sign-up for everyone). Verification recomputes the signature and
// compares in constant time.

async function inviteSignature(code) {
  const secret = process.env.INVITE_COOKIE_SECRET || "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(code));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function buildInviteCookieValue(code) {
  const sig = await inviteSignature(code);
  return `${encodeURIComponent(code)}.${sig}`;
}

export async function verifyInviteCookieValue(value) {
  if (typeof value !== "string") {
    return false;
  }

  const separator = value.lastIndexOf(".");
  if (separator <= 0) {
    return false;
  }

  const encodedCode = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  let code;
  try {
    code = decodeURIComponent(encodedCode);
  } catch {
    return false;
  }

  if (!code) {
    return false;
  }

  const expected = await inviteSignature(code);
  return constantTimeEqual(signature, expected);
}
