import { NextResponse } from "next/server";
import {
  legacyCategoryPairsSummary,
  legacyMainCategoriesSummary,
} from "@/lib/eoi/eoi-main-sub-categories";
import { sendVendorRegistrationEmail } from "@/lib/email/resend-notifications";
import type { VendorRegistrationPayload } from "@/lib/schemas/vendor-registration";
import { vendorRegistrationPayloadSchema } from "@/lib/schemas/vendor-registration";
import { createServiceSupabase } from "@/lib/supabase/service";
import { hashInviteToken } from "@/lib/tokens/eoi-invite";
import {
  fetchEoiByReferenceForVendorLink,
  isWellFormedEoiReference,
  normalizeEoiReference,
} from "@/lib/vendors/eoi-reference";
import type { SupabaseClient } from "@supabase/supabase-js";

async function duplicateRegistrationKey(
  supabase: SupabaseClient,
  pan: string,
  emailLower: string,
  mobile: string,
): Promise<"pan" | "email" | "mobile" | null> {
  const { data: byPan } = await supabase.from("vendor_registration").select("id").eq("pan_number", pan).maybeSingle();
  if (byPan?.id) return "pan";
  const { data: byEmail } = await supabase.from("vendor_registration").select("id").eq("email", emailLower).maybeSingle();
  if (byEmail?.id) return "email";
  const { data: byMob } = await supabase
    .from("vendor_registration")
    .select("id")
    .eq("mobile_number", mobile)
    .maybeSingle();
  if (byMob?.id) return "mobile";
  return null;
}

function mobileMatchesEoiDigits(eoiMobileDigits: string, vendorMobile: string): boolean {
  const eoi = eoiMobileDigits.replace(/\D/g, "").slice(-10);
  const v = vendorMobile.replace(/\D/g, "").slice(-10);
  return eoi.length === 10 && v.length === 10 && eoi === v;
}

function buildInsertRow(p: VendorRegistrationPayload, emailNorm: string, eoiId: string | null) {
  return {
    eoi_id: eoiId,
    its_number: p.its_number,
    company_name: p.company_name,
    vendor_type: p.vendor_type,
    constitution_of_business: p.constitution_of_business,
    year_of_establishment: p.year_of_establishment,
    registered_address: p.registered_address,
    city: p.city,
    state: p.state,
    country: p.country,
    pin_code: p.pin_code,
    primary_contact_person: p.primary_contact_person,
    contact_designation: p.contact_designation,
    mobile_number: p.mobile_number,
    alternate_mobile: p.alternate_mobile === "" ? null : p.alternate_mobile,
    email: emailNorm,
    website: p.website,
    pan_number: p.pan_number,
    gst_registered: p.gst_registered,
    gstin: p.gst_registered ? p.gstin : null,
    msme_registered: p.msme_registered,
    msme_udyam_number: p.msme_udyam_number,
    tan_number: p.tan_number,
    tds_applicability: p.tds_applicability,
    aadhaar_linked_with_pan: p.aadhaar_linked_with_pan,
    bank_name: p.bank_name,
    branch_name: p.branch_name,
    account_holder_name: p.account_holder_name,
    account_number: p.account_number,
    ifsc_code: p.ifsc_code,
    account_type: p.account_type,
    main_category: legacyMainCategoriesSummary(p.category_selections),
    sub_category: legacyCategoryPairsSummary(p.category_selections) || null,
    category_selections: p.category_selections,
    products_services_offered: p.products_services_offered,
    service_location_other: p.service_location_other,
    service_location_pan_india: p.service_location_pan_india,
    service_location_madhya_pradesh: p.service_location_madhya_pradesh,
    service_location_indore: p.service_location_indore,
    additional_service_locations: p.additional_service_locations,
    turnover_fy_2023_24: p.turnover_fy_2023_24,
    turnover_fy_2024_25: p.turnover_fy_2024_25,
    turnover_fy_2025_26: p.turnover_fy_2025_26,
    expected_credit_period: p.expected_credit_period,
    reference_1_name: p.reference_1_name,
    reference_1_contact: p.reference_1_contact,
    reference_2_name: p.reference_2_name,
    reference_2_contact: p.reference_2_contact,
    doc_pan_card: p.doc_pan_card,
    doc_cancelled_cheque: p.doc_cancelled_cheque,
    doc_address_proof: p.doc_address_proof,
    doc_company_registration: p.doc_company_registration,
    doc_gst_certificate: p.gst_registered ? p.doc_gst_certificate : false,
    doc_msme_certificate: p.msme_registered ? p.doc_msme_certificate : false,
    doc_other: p.doc_other,
    doc_other_description: p.doc_other_description,
    policy_accepted: p.policy_accepted,
    declaration_authorized_person_name: p.declaration_authorized_person_name,
    declaration_designation: p.declaration_designation,
    declaration_date: p.declaration_date,
    declaration_place: p.declaration_place,
  };
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = vendorRegistrationPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const p = parsed.data;
  const emailNorm = p.email.trim().toLowerCase();
  const invite = p.invitation_token.trim();
  const hasInvite = invite.length >= 32;

  const supabase = createServiceSupabase();

  const dup = await duplicateRegistrationKey(supabase, p.pan_number, emailNorm, p.mobile_number);
  if (dup) {
    const msg =
      dup === "pan"
        ? "A registration already exists with this PAN. If you submitted before, contact the committee instead of registering again."
        : dup === "email"
          ? "A registration already exists with this email address."
          : "A registration already exists with this mobile number.";
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  if (hasInvite) {
    const tokenHash = hashInviteToken(invite);

    const { data: eoi, error: eoiErr } = await supabase
      .from("expression_of_interest")
      .select("id, email, eoi_status, registration_token_used_at, registration_token_expires_at")
      .eq("registration_token_hash", tokenHash)
      .maybeSingle();

    if (eoiErr || !eoi) {
      return NextResponse.json(
        { error: "Invalid or unknown invitation. Open the registration link from your committee email." },
        { status: 403 },
      );
    }

    if (eoi.eoi_status !== "invited_to_register") {
      return NextResponse.json({ error: "This invitation is no longer valid for registration." }, { status: 403 });
    }

    if (eoi.registration_token_used_at) {
      return NextResponse.json({ error: "This registration link has already been used." }, { status: 403 });
    }

    const exp = eoi.registration_token_expires_at as string | null;
    if (exp && new Date(exp).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This registration link has expired. Contact the committee." },
        { status: 403 },
      );
    }

    if (String(eoi.email).toLowerCase() !== emailNorm) {
      return NextResponse.json(
        { error: "Email must match the Expression of Interest on file for this invitation." },
        { status: 403 },
      );
    }

    const row = buildInsertRow(p, emailNorm, eoi.id as string);

    try {
      const { data: inserted, error } = await supabase.from("vendor_registration").insert(row).select("id").single();

      if (error || !inserted?.id) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          { error: "Could not save registration. Check Supabase configuration and migration (eoi_id column)." },
          { status: 500 },
        );
      }

      await supabase
        .from("expression_of_interest")
        .update({
          eoi_status: "registered",
          registration_token_used_at: new Date().toISOString(),
          vendor_registration_id: inserted.id,
          registration_token_hash: null,
          registration_token_expires_at: null,
        })
        .eq("id", eoi.id);

      const emailResult = await sendVendorRegistrationEmail({
        to: emailNorm,
        companyName: p.company_name,
        contactName: p.primary_contact_person,
      });
      if (!emailResult.ok) {
        console.warn("Registration saved but confirmation email was not sent:", emailResult.error);
      }

      return NextResponse.json({ ok: true, emailSent: emailResult.ok, viaInvitation: true }, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
  }

  const refNorm = normalizeEoiReference(p.eoi_reference.trim());
  const useEoiRef = refNorm.length > 0;

  if (useEoiRef) {
    if (!isWellFormedEoiReference(refNorm)) {
      return NextResponse.json(
        {
          error:
            "Invalid EOI reference format. Use the exact value from your EOI confirmation (for example EOI-2026-ABC123).",
        },
        { status: 422 },
      );
    }

    const lookup = await fetchEoiByReferenceForVendorLink(refNorm);
    if (!lookup.ok) {
      if (lookup.reason === "not_found") {
        return NextResponse.json({ error: "No Expression of Interest found for this reference." }, { status: 404 });
      }
      if (lookup.reason === "already_registered") {
        return NextResponse.json(
          { error: "This EOI reference is already linked to a completed vendor registration." },
          { status: 409 },
        );
      }
      if (lookup.reason === "not_eligible") {
        return NextResponse.json(
          { error: "This Expression of Interest is not open for self-service registration. Contact the committee." },
          { status: 403 },
        );
      }
      return NextResponse.json(
        {
          error:
            "This EOI is in the invitation workflow. Complete registration using the secure link sent to your email, not the reference field.",
        },
        { status: 403 },
      );
    }

    const { row: eoiRow } = lookup;
    if (String(eoiRow.email).toLowerCase() !== emailNorm) {
      return NextResponse.json(
        { error: "Email must match the Expression of Interest for the reference you entered." },
        { status: 403 },
      );
    }
    if (!mobileMatchesEoiDigits(eoiRow.mobile, p.mobile_number)) {
      return NextResponse.json(
        { error: "Mobile number (+91) must match the Expression of Interest for this reference." },
        { status: 403 },
      );
    }
    if (eoiRow.pan_number.toUpperCase().replace(/\s/g, "") !== p.pan_number) {
      return NextResponse.json(
        { error: "PAN must match the Expression of Interest for the reference you entered." },
        { status: 403 },
      );
    }

    const row = buildInsertRow(p, emailNorm, eoiRow.id);

    try {
      const { data: inserted, error } = await supabase.from("vendor_registration").insert(row).select("id").single();

      if (error || !inserted?.id) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          { error: "Could not save registration. Check Supabase configuration and migration (eoi_id column)." },
          { status: 500 },
        );
      }

      await supabase
        .from("expression_of_interest")
        .update({
          eoi_status: "registered",
          vendor_registration_id: inserted.id,
        })
        .eq("id", eoiRow.id);

      const emailResult = await sendVendorRegistrationEmail({
        to: emailNorm,
        companyName: p.company_name,
        contactName: p.primary_contact_person,
      });
      if (!emailResult.ok) {
        console.warn("Registration saved but confirmation email was not sent:", emailResult.error);
      }

      return NextResponse.json({ ok: true, emailSent: emailResult.ok, viaInvitation: false, linkedEoi: true }, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
  }

  const row = buildInsertRow(p, emailNorm, null);

  try {
    const { data: inserted, error } = await supabase.from("vendor_registration").insert(row).select("id").single();

    if (error || !inserted?.id) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Could not save registration. Check Supabase configuration and migration (eoi_id column)." },
        { status: 500 },
      );
    }

    const emailResult = await sendVendorRegistrationEmail({
      to: emailNorm,
      companyName: p.company_name,
      contactName: p.primary_contact_person,
    });
    if (!emailResult.ok) {
      console.warn("Registration saved but confirmation email was not sent:", emailResult.error);
    }

    return NextResponse.json({ ok: true, emailSent: emailResult.ok, viaInvitation: false, linkedEoi: false }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
}
