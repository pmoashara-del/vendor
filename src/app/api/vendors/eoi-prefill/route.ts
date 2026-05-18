import { NextResponse } from "next/server";
import { z } from "zod";
import {
  EOI_PREFILL_SELECT,
  isEoiReferenceInput,
  mobileDigitsFromInput,
  normalizeEoiReference,
} from "@/lib/vendors/eoi-prefill-lookup";
import { mapEoiRowToVendorPrefill } from "@/lib/vendors/eoi-prefill-map";
import { createServiceSupabase } from "@/lib/supabase/service";
import { hashInviteToken } from "@/lib/tokens/eoi-invite";

const bodySchema = z
  .object({
    mobile: z.string().max(40).optional(),
    reference: z.string().max(40).optional(),
    invitation_token: z.string().max(128).optional(),
  })
  .refine((d) => Boolean(d.mobile?.trim() || d.reference?.trim() || d.invitation_token?.trim()), {
    message: "Provide mobile, EOI reference, or invitation token",
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

  const token = parsed.data.invitation_token?.trim() ?? "";
  const reference = parsed.data.reference?.trim()
    ? normalizeEoiReference(parsed.data.reference)
    : parsed.data.mobile?.trim() && isEoiReferenceInput(parsed.data.mobile)
      ? normalizeEoiReference(parsed.data.mobile)
      : null;
  const mobileRaw = parsed.data.mobile?.trim() ?? "";
  const digits = reference ? null : mobileDigitsFromInput(mobileRaw);

  if (!token && !reference && !digits) {
    return NextResponse.json(
      { error: "Enter your EOI reference (e.g. EOI-2026-ABC123) or a valid 10-digit mobile number" },
      { status: 422 },
    );
  }

  try {
    const supabase = createServiceSupabase();
    let query = supabase.from("expression_of_interest").select(EOI_PREFILL_SELECT);

    if (token.length >= 32) {
      query = query.eq("registration_token_hash", hashInviteToken(token));
    } else if (reference) {
      query = query.eq("reference_number", reference);
    } else if (digits) {
      query = query.or(`mobile.eq.${digits},mobile.eq.91${digits},mobile.eq.+91${digits}`);
    }

    const { data: rows, error } = await query.order("created_at", { ascending: false }).limit(1);

    if (error) {
      console.error("eoi-prefill:", error);
      return NextResponse.json({ error: "Could not look up EOI" }, { status: 500 });
    }

    const row = rows?.[0] ?? null;
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
