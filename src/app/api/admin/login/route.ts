import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminCookieName, signAdminSession, getSessionSecret } from "@/lib/admin-session";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password =
    typeof body === "object" && body !== null && "password" in body
      ? (body as { password?: unknown }).password
      : undefined;

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const expected = process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!expected || expected.length < 8) {
    return NextResponse.json({ error: "Server admin password not configured" }, { status: 500 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  try {
    const token = signAdminSession(getSessionSecret());
    const jar = await cookies();
    jar.set(getAdminCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Session secret not configured" }, { status: 500 });
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(getAdminCookieName());
  return NextResponse.json({ ok: true });
}
