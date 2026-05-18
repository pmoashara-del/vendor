import { NextResponse } from "next/server";
import { z } from "zod";
import { mapEoiRowToVendorPrefill } from "@/lib/vendors/eoi-prefill-map";
import { createServiceSupabase } from "@/lib/supabase/service";

const bodySchema = z.object({
  mobile: z.string().min(1).max(20),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const digits = parsed.data.mobile.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 422 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data: row, error } = await supabase
      .from("expression_of_interest")
      .select(
        "business_name, entity_type, year_established, business_city, business_state, business_address, contact_person_name, contact_role, mobile, email, its_number, pan_number, gst_number, gst_status, msme_status, category_selections, capability_description, created_at",
      )
      .eq("mobile", digits)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("eoi-prefill:", error);
      return NextResponse.json({ error: "Could not look up EOI" }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ found: false, prefill: {} as Record<string, never> }, { status: 200 });
    }

    const prefill = mapEoiRowToVendorPrefill(row as Record<string, unknown>);
    return NextResponse.json({ found: true, prefill }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
}
