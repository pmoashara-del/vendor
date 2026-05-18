import type { CategorySelection } from "@/lib/eoi/eoi-main-sub-categories";
import { normalizeCategorySelections } from "@/lib/eoi/eoi-main-sub-categories";

/** Fields the client may merge into vendor registration after an EOI match. */
export type VendorRegistrationPrefill = {
  company_name?: string;
  constitution_of_business?: string;
  year_of_establishment?: string;
  registered_address?: string;
  city?: string;
  state?: string;
  primary_contact_person?: string;
  contact_designation?: string;
  mobile_number?: string;
  email?: string;
  its_number?: string;
  pan_number?: string;
  gst_registered?: boolean;
  gstin?: string;
  msme_registered?: boolean;
  category_selections?: CategorySelection[];
  products_services_offered?: string;
};

function mapEntityTypeToConstitution(entityType: string): string | undefined {
  const m: Record<string, string> = {
    Proprietorship: "Proprietorship",
    Partnership: "Partnership firm",
    LLP: "LLP",
    "Private Limited Company": "Private limited",
    "Public Limited Company": "Public limited",
    "Society / Trust": "Trust / society",
    Other: "Other",
    HUF: "Other",
  };
  return m[entityType];
}

function mobileToVendorFormat(mobileDigits: string): string {
  const d = mobileDigits.replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return "+91";
  return `+91${d}`;
}

function parseCategorySelections(raw: unknown): CategorySelection[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const tuples: CategorySelection[] = [];
  for (const item of raw) {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const main = typeof o.main === "string" ? o.main : "";
      const sub = typeof o.sub === "string" ? o.sub : "";
      tuples.push({ main, sub });
    }
  }
  const n = normalizeCategorySelections(tuples);
  return n.length ? n : undefined;
}

/** Map latest EOI row (same shape as DB select) into vendor form prefill. */
export function mapEoiRowToVendorPrefill(row: Record<string, unknown>): VendorRegistrationPrefill {
  const out: VendorRegistrationPrefill = {};

  const businessName = row.business_name;
  if (typeof businessName === "string" && businessName.trim()) out.company_name = businessName.trim();

  const entityType = row.entity_type;
  if (typeof entityType === "string") {
    const c = mapEntityTypeToConstitution(entityType);
    if (c) out.constitution_of_business = c;
  }

  const yr = row.year_established;
  if (typeof yr === "number" && Number.isFinite(yr)) {
    out.year_of_establishment = String(yr);
  } else if (typeof yr === "string" && /^\d{4}$/.test(yr.trim())) {
    out.year_of_establishment = yr.trim();
  }

  const addr = row.business_address;
  if (typeof addr === "string" && addr.trim()) out.registered_address = addr.trim();

  const city = row.business_city;
  if (typeof city === "string" && city.trim()) out.city = city.trim();

  const state = row.business_state;
  if (typeof state === "string" && state.trim()) out.state = state.trim();

  const cp = row.contact_person_name;
  if (typeof cp === "string" && cp.trim()) out.primary_contact_person = cp.trim();

  const role = row.contact_role;
  if (typeof role === "string" && role.trim()) out.contact_designation = role.trim();

  const mob = row.mobile;
  if (typeof mob === "string" && mob.replace(/\D/g, "").length >= 10) {
    out.mobile_number = mobileToVendorFormat(mob);
  }

  const email = row.email;
  if (typeof email === "string" && email.includes("@")) out.email = email.trim().toLowerCase();

  const its = row.its_number;
  if (typeof its === "string" && /^\d{8}$/.test(its.replace(/\D/g, "").slice(0, 8))) {
    out.its_number = its.replace(/\D/g, "").slice(0, 8);
  }

  const pan = row.pan_number;
  if (typeof pan === "string" && pan.replace(/\s/g, "").length >= 10) {
    out.pan_number = pan.toUpperCase().replace(/\s/g, "").slice(0, 10);
  }

  const gstStatus = row.gst_status;
  const gstNum = row.gst_number;
  if (gstStatus === "Registered" && typeof gstNum === "string" && gstNum.replace(/\s/g, "").length === 15) {
    out.gst_registered = true;
    out.gstin = gstNum.toUpperCase().replace(/\s/g, "");
  } else {
    out.gst_registered = false;
    out.gstin = "";
  }

  const msme = row.msme_status;
  if (typeof msme === "string") {
    out.msme_registered = msme.startsWith("Yes");
  }

  const cats = parseCategorySelections(row.category_selections);
  if (cats?.length) out.category_selections = cats;

  const cap = row.capability_description;
  if (typeof cap === "string" && cap.trim()) out.products_services_offered = cap.trim();

  return out;
}
