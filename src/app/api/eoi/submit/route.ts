import { NextResponse } from "next/server";
import { eoiSubmitSchema } from "@/lib/schemas/eoi";
import { sendEoiSubmittedEmail } from "@/lib/email/resend-notifications";
import { createServerAnonSupabase } from "@/lib/supabase/server-anon";
import { randomBytes } from "crypto";

function generateReference(): string {
  const y = new Date().getFullYear();
  const n = randomBytes(3).toString("hex").toUpperCase();
  return `EOI-${y}-${n}`;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = eoiSubmitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const p = parsed.data;
  const mobileDigits = p.mobile;

  const row = {
    reference_number: generateReference(),
    business_name: p.business_name,
    entity_type: p.entity_type,
    year_established: p.year_established,
    business_address: p.business_address,
    contact_person_name: p.contact_person_name,
    contact_role: p.contact_role ?? null,
    mobile: mobileDigits,
    email: p.email.trim().toLowerCase(),
    primary_category: p.primary_category,
    departments_served: p.departments_served,
    zones: p.zones,
    experience_years: p.experience_years,
    turnover_range: p.turnover_range ?? null,
    capability_description: p.capability_description,
    previous_work: p.previous_work ?? null,
    its_number: p.its_number,
    pan_number: p.pan_number,
    gst_number: p.gst_number,
    gst_status: p.gst_status,
    msme_status: p.msme_status ?? null,
    certifications: p.certifications ?? null,
    source: p.source ?? null,
    declaration_accepted: p.declaration_accepted,
  };

  try {
    const supabase = createServerAnonSupabase();
    for (let attempt = 0; attempt < 5; attempt++) {
      const ref = generateReference();
      const { data, error } = await supabase
        .from("expression_of_interest")
        .insert({ ...row, reference_number: ref })
        .select("id, reference_number")
        .single();

      if (!error && data) {
        const emailResult = await sendEoiSubmittedEmail({
          to: row.email,
          referenceNumber: data.reference_number,
          businessName: row.business_name,
          contactName: row.contact_person_name,
        });
        return NextResponse.json(
          { ok: true, id: data.id, reference_number: data.reference_number, emailSent: emailResult.ok },
          { status: 201 },
        );
      }
      if (error?.code !== "23505") {
        console.error("EOI insert error:", error);
        return NextResponse.json(
          { error: "Could not save EOI. Check Supabase migration and RLS." },
          { status: 500 },
        );
      }
    }
    return NextResponse.json({ error: "Could not assign reference number" }, { status: 500 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
}
