import { createServiceSupabase } from "@/lib/supabase/service";
import { mapEoiRowToVendorPrefill } from "@/lib/vendors/eoi-prefill-map";

const REF_PATTERN = /^EOI-\d{4}-[A-F0-9]{6}$/;

/** Normalise user input to match stored `reference_number` (e.g. EOI-2026-A1B2C3). */
export function normalizeEoiReference(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/[\s\u200b]+/g, "");
  if (REF_PATTERN.test(t)) return t;
  const compact = t.replace(/-/g, "");
  const m = compact.match(/^EOI(\d{4})([A-F0-9]{6})$/);
  if (m) return `EOI-${m[1]}-${m[2]}`;
  return t;
}

export function isWellFormedEoiReference(ref: string): boolean {
  return REF_PATTERN.test(normalizeEoiReference(ref));
}

export type EoiRowForVendorLink = {
  id: string;
  reference_number: string;
  eoi_status: string;
  vendor_registration_id: string | null;
  email: string;
  mobile: string;
  pan_number: string;
  business_name: string;
  entity_type: string;
  year_established: number;
  business_address: string;
  business_city: string | null;
  business_state: string | null;
  contact_person_name: string;
  contact_role: string | null;
  its_number: string | null;
  gst_number: string | null;
  gst_status: string;
  msme_status: string | null;
  category_selections: unknown;
  capability_description: string;
  can_work_in_programme_location: string | null;
  also_supplies_other_locations: string | null;
  other_supply_locations_detail: string | null;
  turnover_range: string | null;
};

const EOI_SELECT_FOR_VENDOR =
  "id, reference_number, eoi_status, vendor_registration_id, email, mobile, pan_number, business_name, entity_type, year_established, business_address, business_city, business_state, contact_person_name, contact_role, its_number, gst_number, gst_status, msme_status, category_selections, capability_description, can_work_in_programme_location, also_supplies_other_locations, other_supply_locations_detail, turnover_range";

export async function fetchEoiByReferenceForVendorLink(
  refNorm: string,
): Promise<
  | { ok: true; row: EoiRowForVendorLink }
  | {
      ok: false;
      reason: "not_found" | "already_registered" | "use_invite_link" | "not_eligible";
    }
> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("expression_of_interest")
    .select(EOI_SELECT_FOR_VENDOR)
    .eq("reference_number", refNorm)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: "not_found" };
  }

  const row = data as EoiRowForVendorLink;

  if (row.vendor_registration_id) {
    return { ok: false, reason: "already_registered" };
  }

  if (row.eoi_status === "registered") {
    return { ok: false, reason: "already_registered" };
  }

  if (row.eoi_status === "invited_to_register") {
    return { ok: false, reason: "use_invite_link" };
  }

  if (row.eoi_status === "declined") {
    return { ok: false, reason: "not_eligible" };
  }

  return { ok: true, row };
}

export function eoiRowToPrefillAndServiceFlags(row: EoiRowForVendorLink): {
  prefill: ReturnType<typeof mapEoiRowToVendorPrefill>;
  service_location_pan_india: boolean;
  service_location_madhya_pradesh: boolean;
  service_location_indore: boolean;
  service_location_other: boolean;
  additional_service_locations: string | null;
} {
  const prefill = mapEoiRowToVendorPrefill(row as unknown as Record<string, unknown>);

  const can = row.can_work_in_programme_location;
  const inProgramme = can === "Yes" || can === "Limited";
  const service_location_pan_india = false;
  const service_location_madhya_pradesh = inProgramme;
  const service_location_indore = inProgramme;
  const also = row.also_supplies_other_locations === "Yes";
  const detail = row.other_supply_locations_detail?.trim() ?? "";
  const service_location_other = also && detail.length > 0;
  const additional_service_locations = service_location_other ? detail : null;

  return {
    prefill,
    service_location_pan_india,
    service_location_madhya_pradesh,
    service_location_indore,
    service_location_other,
    additional_service_locations,
  };
}

/** Human-readable lines for the vendor registration “from your EOI” panel. */
export function buildEoiSummaryLines(row: EoiRowForVendorLink): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [
    { label: "EOI reference", value: row.reference_number },
    { label: "Business / company name", value: row.business_name },
    { label: "Entity type", value: row.entity_type },
    { label: "Year established", value: String(row.year_established) },
    { label: "Address", value: row.business_address },
    { label: "City", value: (row.business_city ?? "").trim() || "—" },
    { label: "State", value: (row.business_state ?? "").trim() || "—" },
    { label: "Contact person", value: row.contact_person_name },
    { label: "Role / designation", value: (row.contact_role ?? "").trim() || "—" },
    { label: "Mobile", value: row.mobile.length === 10 ? `+91${row.mobile}` : row.mobile },
    { label: "Email", value: row.email },
  ];
  if (row.its_number) lines.push({ label: "ITS number", value: row.its_number });
  lines.push({ label: "PAN", value: row.pan_number });
  lines.push({ label: "GST status", value: row.gst_status });
  if (row.gst_number) lines.push({ label: "GSTIN", value: row.gst_number });
  lines.push({ label: "MSME (EOI)", value: (row.msme_status ?? "").trim() || "—" });
  if (row.turnover_range) lines.push({ label: "Turnover range (EOI)", value: row.turnover_range });
  lines.push({ label: "Capability / offerings (EOI)", value: row.capability_description });
  const can = row.can_work_in_programme_location ?? "—";
  lines.push({ label: "Programme area (EOI)", value: can });
  if (row.also_supplies_other_locations) {
    lines.push({ label: "Also supplies elsewhere", value: row.also_supplies_other_locations });
  }
  if (row.other_supply_locations_detail?.trim()) {
    lines.push({ label: "Other locations (EOI)", value: row.other_supply_locations_detail.trim() });
  }
  return lines;
}
