import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "nexro_admin";

/** Web Crypto HMAC-SHA256 using SubtleCrypto (Edge-compatible) */
async function hmacSha256Base64url(
  secret: string,
  data: string,
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  // base64url encode
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Constant-time string comparison using SubtleCrypto digest trick */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  if (va.length !== vb.length) return false;
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

/** Verify admin cookie — format: payload.sig */
async function verifyAdminCookie(
  cookie: string,
  secret: string,
): Promise<boolean> {
  if (!cookie) return false;
  const dot = cookie.lastIndexOf(".");
  if (dot === -1) return false;
  const payload = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = await hmacSha256Base64url(secret, payload);
  if (!(await safeEqual(expected, sig))) return false;
  try {
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(decoded);
    return typeof exp === "number" && Date.now() / 1000 < exp;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const adminSecret = process.env.ADMIN_SECRET ?? "";

  if (!adminSecret) {
    return new NextResponse(
      "Admin access disabled. Set ADMIN_SECRET env var.",
      {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value ?? "";
  if (!(await verifyAdminCookie(cookie, adminSecret))) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
