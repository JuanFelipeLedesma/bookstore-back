import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const has = Boolean(req.cookies.get("auth")?.value);
  return NextResponse.json({ authenticated: has });
}