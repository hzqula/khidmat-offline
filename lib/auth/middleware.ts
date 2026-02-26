import { type NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { type SessionData, sessionOptions } from "@/lib/session";

const PUBLIC_PATHS = ["/", "/display", "/api/public", "/auth"];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublic) return NextResponse.next();

  const res = NextResponse.next();

  // Pakai pasangan request + response, bukan request.cookies
  const session = await getIronSession<SessionData>(
    request,
    res,
    sessionOptions,
  );

  if (!session.userId) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return res;
}
