import type { VendorRegistrationRow } from "@/types/vendor";

function categoryPairsForAi(v: VendorRegistrationRow): string[] {
  const raw = v.category_selections;
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const main = typeof o.main === "string" ? o.main.trim() : "";
        const sub = typeof o.sub === "string" ? o.sub.trim() : "";
        if (main && sub) out.push(`${main} — ${sub}`);
      }
    }
    if (out.length) return out;
  }
  const m = v.main_category?.trim() ?? "";
  const s = (v.sub_category ?? "").trim();
  if (m && s) return [`${m} — ${s}`];
  if (m) return [m];
  return [];
}

/** Strip sensitive fields before sending to an external LLM. */
export function toVendorAiSnapshot(v: VendorRegistrationRow): Record<string, unknown> {
  const email = v.email;
  const emailDomain = email.includes("@") ? email.split("@")[1] ?? "unknown" : "unknown";
  return {
    id: v.id,
    submitted_at: v.created_at,
    status: v.registration_status,
    company_name: v.company_name,
    vendor_type: v.vendor_type,
    constitution: v.constitution_of_business,
    city: v.city,
    state: v.state,
    country: v.country,
    main_category: v.main_category,
    sub_category: v.sub_category,
    category_pairs: categoryPairsForAi(v),
    gst_registered: v.gst_registered,
    msme_registered: v.msme_registered,
    email_domain: emailDomain,
    products_preview: (v.products_services_offered ?? "").slice(0, 400),
    service_areas: {
      pan_india: v.service_location_pan_india,
      mp: v.service_location_madhya_pradesh,
      indore: v.service_location_indore,
    },
    turnover_present: Boolean(
      v.turnover_fy_2023_24 != null || v.turnover_fy_2024_25 != null || v.turnover_fy_2025_26 != null,
    ),
  };
}

/** Richer snapshot for single-vendor review (still no PAN / bank / GSTIN / account). */
export function toVendorAiSnapshotDetail(v: VendorRegistrationRow): Record<string, unknown> {
  return {
    ...toVendorAiSnapshot(v),
    primary_contact_role: v.contact_designation,
    website: v.website,
    expected_credit_period: v.expected_credit_period,
    references_count: [v.reference_1_name, v.reference_2_name].filter(Boolean).length,
    policy_accepted: v.policy_accepted,
    doc_flags: {
      pan_doc: v.doc_pan_card,
      cheque: v.doc_cancelled_cheque,
      address: v.doc_address_proof,
      registration: v.doc_company_registration,
      gst_cert: v.doc_gst_certificate,
      msme_cert: v.doc_msme_certificate,
    },
    aadhaar_pan_linked: v.aadhaar_linked_with_pan,
  };
}

export function buildAggregateLines(vendors: VendorRegistrationRow[]): string[] {
  const total = vendors.length;
  const byStatus = new Map<string, number>();
  const byType = new Map<string, number>();
  const byState = new Map<string, number>();
  let gst = 0;
  let msme = 0;
  const last7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let newWeek = 0;
  for (const v of vendors) {
    byStatus.set(v.registration_status, (byStatus.get(v.registration_status) ?? 0) + 1);
    byType.set(v.vendor_type || "(blank)", (byType.get(v.vendor_type || "(blank)") ?? 0) + 1);
    byState.set(v.state || "(blank)", (byState.get(v.state || "(blank)") ?? 0) + 1);
    if (v.gst_registered) gst++;
    if (v.msme_registered) msme++;
    if (new Date(v.created_at).getTime() >= last7) newWeek++;
  }
  return [
    `total_registrations: ${total}`,
    `new_last_7_days: ${newWeek}`,
    `gst_registered_count: ${gst}`,
    `msme_registered_count: ${msme}`,
    `by_status: ${JSON.stringify(Object.fromEntries(byStatus))}`,
    `by_vendor_type: ${JSON.stringify(Object.fromEntries(byType))}`,
    `by_state: ${JSON.stringify(Object.fromEntries(byState))}`,
  ];
}
