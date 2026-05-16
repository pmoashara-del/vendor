import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { sendEoiRegistrationInviteEmail } from "@/lib/email/resend-notifications";
import { createServiceSupabase } from "@/lib/supabase/service";
import { generateInviteToken, hashInviteToken } from "@/lib/tokens/eoi-invite";

function publicAppUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  const v = process.env.VERCEL_URL?.trim();
  if (v) return `https://${v.replace(/\/$/, "")}`;
  return "";
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const base = publicAppUrl();
  if (!base) {
    return NextResponse.json(
      { error: "Set NEXT_PUBLIC_APP_URL in .env.local so registration links work." },
      { status: 500 },
    );
  }

  try {
    const supabase = createServiceSupabase();
    const { data: row, error: fe } = await supabase.from("expression_of_interest").select("*").eq("id", id).maybeSingle();

    if (fe || !row) return NextResponse.json({ error: "EOI not found" }, { status: 404 });

    if (row.eoi_status !== "meeting_invited" && row.eoi_status !== "invited_to_register") {
      return NextResponse.json(
        { error: "Set status to meeting invited first, or vendor must already be at registration stage." },
        { status: 400 },
      );
    }

    if (row.registration_token_used_at) {
      return NextResponse.json({ error: "Registration already completed for this EOI." }, { status: 400 });
    }

    const token = generateInviteToken();
    const hash = hashInviteToken(token);
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: up } = await supabase
      .from("expression_of_interest")
      .update({
        eoi_status: "invited_to_register",
        registration_token_hash: hash,
        registration_token_expires_at: expires,
      })
      .eq("id", id);

    if (up) {
      console.error(up);
      return NextResponse.json({ error: "Could not save invitation token" }, { status: 500 });
    }

    const registrationUrl = `${base}/vendor-registration?token=${encodeURIComponent(token)}`;

    const emailResult = await sendEoiRegistrationInviteEmail({
      to: String(row.email),
      businessName: String(row.business_name),
      contactName: String(row.contact_person_name),
      registrationUrl,
    });

    return NextResponse.json({
      ok: true,
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? undefined : emailResult.error,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
