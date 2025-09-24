import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/api/logout",
  "/api/session",
  "/_next",        
  "/favicon.ico",
  "/images",      
  "/public"
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasAuth = req.cookies.get("auth")?.value;
  if (!hasAuth) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);  
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};