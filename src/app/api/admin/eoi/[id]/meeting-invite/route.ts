import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { sendEoiMeetingInviteEmail } from "@/lib/email/resend-notifications";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const supabase = createServiceSupabase();
    const { data: row, error: fe } = await supabase.from("expression_of_interest").select("*").eq("id", id).maybeSingle();

    if (fe || !row) return NextResponse.json({ error: "EOI not found" }, { status: 404 });

    const status = row.eoi_status as string;
    if (status === "declined" || status === "registered") {
      return NextResponse.json({ error: "Cannot invite this submission" }, { status: 400 });
    }

    const { error: up } = await supabase
      .from("expression_of_interest")
      .update({
        eoi_status: "meeting_invited",
        meeting_invite_sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (up) {
      console.error(up);
      return NextResponse.json({ error: "Could not update EOI" }, { status: 500 });
    }

    const emailResult = await sendEoiMeetingInviteEmail({
      to: String(row.email),
      businessName: String(row.business_name),
      contactName: String(row.contact_person_name),
    });

    return NextResponse.json({ ok: true, emailSent: emailResult.ok, emailError: emailResult.ok ? undefined : emailResult.error });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
