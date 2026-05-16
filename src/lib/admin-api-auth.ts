import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminSessionToken, getSessionSecret } from "@/lib/admin-session";

export async function requireAdminApi(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const jar = await cookies();
  const token = jar.get(getAdminCookieName())?.value;
  if (!token) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  try {
    if (!verifyAdminSessionToken(token, getSessionSecret())) {
      return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
  } catch {
    return { ok: false, res: NextResponse.json({ error: "Server misconfigured" }, { status: 500 }) };
  }
  return { ok: true };
}
