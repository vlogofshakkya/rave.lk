import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
// Aliased: this file exports its own `config` for the route matcher.
import { config as appConfig } from "@/config";

/**
 * Gate every /admin route except the login page. This runs on the Edge
 * runtime, so it only verifies the JWT — the DB-backed checks happen in
 * the page/action layer.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get("rave_session")?.value;
  const secret = appConfig.authSecret;

  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch {
      // Fall through to the redirect below.
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  const res = NextResponse.redirect(url);
  // Clear a stale/invalid cookie so the login page starts clean.
  if (token) res.cookies.delete("rave_session");
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
