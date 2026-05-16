import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { sendVendorApprovedEmail } from "@/lib/email/resend-notifications";
import { createServiceSupabase } from "@/lib/supabase/service";

const statusSchema = z.object({
  registration_status: z.enum(["pending", "under_review", "approved", "rejected", "on_hold"]),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid vendor id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 422 });
  }

  const newStatus = parsed.data.registration_status;

  try {
    const supabase = createServiceSupabase();
    const { data: existing, error: fetchErr } = await supabase
      .from("vendor_registration")
      .select("registration_status, email, company_name, primary_contact_person")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const oldStatus = existing.registration_status as string;

    const { error: updateErr } = await supabase
      .from("vendor_registration")
      .update({ registration_status: newStatus })
      .eq("id", id);

    if (updateErr) {
      console.error(updateErr);
      return NextResponse.json({ error: "Could not update status" }, { status: 500 });
    }

    let approvalEmailSent = false;
    if (newStatus === "approved" && oldStatus !== "approved") {
      const email = String(existing.email ?? "").trim().toLowerCase();
      if (email) {
        const r = await sendVendorApprovedEmail({
          to: email,
          companyName: String(existing.company_name ?? ""),
          contactName: String(existing.primary_contact_person ?? ""),
        });
        approvalEmailSent = r.ok;
        if (!r.ok) console.warn("Vendor approved but email not sent:", r.error);
      }
    }

    return NextResponse.json({ ok: true, approvalEmailSent });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
