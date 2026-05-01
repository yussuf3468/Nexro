import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "nexro_admin";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

/** base64url using Node — must match the Web Crypto version in middleware */
function toBase64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(data: string, secret: string): string {
  return toBase64url(createHmac("sha256", secret).update(data).digest());
}

function makeAdminCookie(secret: string): string {
  const payload = toBase64url(
    Buffer.from(
      JSON.stringify({
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
      }),
    ),
  );
  return `${payload}.${sign(payload, secret)}`;
}

/** POST /api/admin/auth */
export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET ?? "";
  if (!adminSecret) {
    return NextResponse.json({ error: "Admin access disabled." }, { status: 503 });
  }

  let password: string;
  try {
    const body = await request.json();
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Constant-time compare
  const maxLen = Math.max(password.length, adminSecret.length, 1);
  const a = Buffer.alloc(maxLen, 0);
  const b = Buffer.alloc(maxLen, 0);
  Buffer.from(password).copy(a);
  Buffer.from(adminSecret).copy(b);

  const match = timingSafeEqual(a, b) && password.length === adminSecret.length;
  if (!match) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const cookie = makeAdminCookie(adminSecret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}

/** DELETE /api/admin/auth — logout */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}
