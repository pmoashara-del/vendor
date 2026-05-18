/** Columns loaded for vendor registration prefill from expression_of_interest. */
export const EOI_PREFILL_SELECT =
  "business_name, entity_type, year_established, business_city, business_state, business_address, contact_person_name, contact_role, mobile, email, its_number, pan_number, gst_number, gst_status, msme_status, category_selections, capability_description, created_at";

export function isEoiReferenceInput(raw: string): boolean {
  return /^EOI-/i.test(raw.trim());
}

/** Normalize user input to stored reference format (EOI-YYYY-HEX). */
export function normalizeEoiReference(raw: string): string | null {
  const t = raw.trim().toUpperCase().replace(/\s/g, "");
  if (!/^EOI-\d{4}-[A-F0-9]{6}$/.test(t)) return null;
  return t;
}

export function mobileDigitsFromInput(raw: string): string | null {
  const d = raw.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? d : null;
}

export function sanitizePrefillLookupInput(raw: string): string {
  const t = raw.trim();
  if (isEoiReferenceInput(t)) {
    return t.toUpperCase().replace(/\s/g, "").slice(0, 24);
  }
  return t.replace(/\D/g, "").slice(0, 10);
}
