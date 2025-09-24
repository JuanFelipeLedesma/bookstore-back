import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),  
  remember: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { email, remember } = parsed.data;

  // token demo
  const token = Buffer.from(`${email}:${Date.now()}`).toString("base64url");

  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth", token, {
    httpOnly: true,            // protegido
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 4, // 30d o 4h
  });
  return res;
}