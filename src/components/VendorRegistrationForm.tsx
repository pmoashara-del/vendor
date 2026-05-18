"use client";

import { useEffect, useState } from "react";
import { CategorySelectionsPicker } from "@/components/CategorySelectionsPicker";
import { isValidCategorySelectionsList, type CategorySelection } from "@/lib/eoi/eoi-main-sub-categories";
import type { VendorRegistrationPrefill } from "@/lib/vendors/eoi-prefill-map";
import {
  VENDOR_DONTS,
  VENDOR_DOS,
  VENDOR_FAQ,
  VENDOR_POLICY_ACCEPTANCE_LABEL,
  VENDOR_POLICY_MATTERS,
  VENDOR_REGISTRATION_POLICY_INTRO,
  VENDOR_TDS_POLICY,
} from "@/lib/vendors/vendor-registration-policy-text";
import {
  buildGstinPrefix,
  DEFAULT_GST_STATE_CODE,
  gstinBelongsToPAN,
  validateGSTIN,
  validatePAN,
} from "@/lib/india-tax-ids";

const IFSC_FORMAT_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

type AadhaarLink = "yes" | "no" | "unknown";

interface FormState {
  company_name: string;
  vendor_type: string;
  constitution_of_business: string;
  year_of_establishment: string;
  registered_address: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  primary_contact_person: string;
  contact_designation: string;
  mobile_number: string;
  alternate_mobile: string;
  email: string;
  its_number: string;
  website: string;
  pan_number: string;
  gst_registered: boolean;
  gstin: string;
  msme_registered: boolean;
  msme_udyam_number: string;
  tan_number: string;
  tds_applicability: string;
  aadhaar_linked_with_pan: AadhaarLink | "";
  bank_name: string;
  branch_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  category_selections: CategorySelection[];
  products_services_offered: string;
  service_location_pan_india: boolean;
  service_location_madhya_pradesh: boolean;
  service_location_indore: boolean;
  service_location_other: boolean;
  additional_service_locations: string;
  turnover_fy_2023_24: string;
  turnover_fy_2024_25: string;
  turnover_fy_2025_26: string;
  expected_credit_period: string;
  reference_1_name: string;
  reference_1_contact: string;
  reference_2_name: string;
  reference_2_contact: string;
  doc_pan_card: boolean;
  doc_cancelled_cheque: boolean;
  doc_address_proof: boolean;
  doc_company_registration: boolean;
  doc_gst_certificate: boolean;
  doc_msme_certificate: boolean;
  doc_other: boolean;
  doc_other_description: string;
  policy_accepted: boolean;
  declaration_authorized_person_name: string;
  declaration_designation: string;
  declaration_date: string;
  declaration_place: string;
}

const initial: FormState = {
  company_name: "",
  vendor_type: "",
  constitution_of_business: "",
  year_of_establishment: "",
  registered_address: "",
  city: "Indore",
  state: "Madhya Pradesh",
  country: "India",
  pin_code: "452001",
  primary_contact_person: "",
  contact_designation: "",
  mobile_number: "+91",
  alternate_mobile: "",
  email: "",
  its_number: "",
  website: "",
  pan_number: "",
  gst_registered: false,
  gstin: "",
  msme_registered: false,
  msme_udyam_number: "",
  tan_number: "",
  tds_applicability: "",
  aadhaar_linked_with_pan: "",
  bank_name: "",
  branch_name: "",
  account_holder_name: "",
  account_number: "",
  ifsc_code: "",
  account_type: "",
  category_selections: [],
  products_services_offered: "",
  service_location_pan_india: false,
  service_location_madhya_pradesh: true,
  service_location_indore: true,
  service_location_other: false,
  additional_service_locations: "",
  turnover_fy_2023_24: "",
  turnover_fy_2024_25: "",
  turnover_fy_2025_26: "",
  expected_credit_period: "",
  reference_1_name: "",
  reference_1_contact: "",
  reference_2_name: "",
  reference_2_contact: "",
  doc_pan_card: false,
  doc_cancelled_cheque: false,
  doc_address_proof: false,
  doc_company_registration: false,
  doc_gst_certificate: false,
  doc_msme_certificate: false,
  doc_other: false,
  doc_other_description: "",
  policy_accepted: false,
  declaration_authorized_person_name: "",
  declaration_designation: "",
  declaration_date: new Date().toISOString().slice(0, 10),
  declaration_place: "Indore",
};

function labelClass() {
  return "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1";
}

function inputClass() {
  return "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:border-zinc-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100";
}

/** When GST is enabled, keep GSTIN prefix aligned with PAN unless the user entered a valid GSTIN for another entity. Last three GSTIN characters are never auto-filled. */

function formatIndianNumberDisplay(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n < 0) return raw.trim();
  return n.toLocaleString("en-IN");
}

function csvEscapeCell(s: string): string {
  const t = s.replace(/\r\n/g, "\n");
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function applyPanChange(prev: FormState, panRaw: string): FormState {
  const pan = panRaw.toUpperCase().replace(/\s/g, "").slice(0, 10);
  const next: FormState = { ...prev, pan_number: pan };
  if (!next.gst_registered) return next;
  if (!validatePAN(pan)) return next;
  const prefix = buildGstinPrefix(pan, DEFAULT_GST_STATE_CODE);
  const cur = next.gstin.trim().toUpperCase().replace(/\s/g, "");
  if (validateGSTIN(cur) && !gstinBelongsToPAN(cur, pan)) return next;
  const suffix = cur.startsWith(prefix) && cur.length > 12 ? cur.slice(12, 15) : "";
  return { ...next, gstin: (prefix + suffix).slice(0, 15) };
}

function SectionTitle({ n, title }: { n?: number; title: string }) {
  return (
    <h2 className="mt-10 border-b border-zinc-200 pb-2 text-lg font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
      {n != null ? (
        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
          {n}
        </span>
      ) : null}
      {title}
    </h2>
  );
}

export function VendorRegistrationForm({
  invitationToken = "",
  initialEoiReference = "",
}: {
  invitationToken?: string;
  /** Optional query `?eoi=EOI-…` to pre-fill the reference field */
  initialEoiReference?: string;
}) {
  const [f, setF] = useState<FormState>(initial);
  const [categoryPickerError, setCategoryPickerError] = useState(false);
  const [eoiRefInput, setEoiRefInput] = useState("");
  const [linkedEoiReference, setLinkedEoiReference] = useState<string | null>(null);
  const [eoiSummaryLines, setEoiSummaryLines] = useState<{ label: string; value: string }[] | null>(null);
  const [prefillBusy, setPrefillBusy] = useState(false);
  const [prefillMsg, setPrefillMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [ifscLookupBusy, setIfscLookupBusy] = useState(false);
  const [ifscLookup, setIfscLookup] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const hasInvite = invitationToken.trim().length >= 32;
  const linkedFromEoi = linkedEoiReference !== null;

  useEffect(() => {
    const t = initialEoiReference.trim();
    if (t) setEoiRefInput(t);
  }, [initialEoiReference]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((p) => ({ ...p, [key]: value }));
  }

  function applyPrefill(prefill: VendorRegistrationPrefill) {
    setF((prev) => ({
      ...prev,
      ...prefill,
      category_selections: prefill.category_selections?.length
        ? prefill.category_selections
        : prev.category_selections,
      gst_registered: prefill.gst_registered ?? prev.gst_registered,
      gstin: prefill.gstin ?? prev.gstin,
      msme_registered: prefill.msme_registered ?? prev.msme_registered,
    }));
    setCategoryPickerError(false);
  }

  async function fetchEoiByReference() {
    const raw = eoiRefInput.trim();
    if (raw.length < 8) {
      setPrefillMsg("Enter the full EOI reference (for example EOI-2026-ABC123) from your confirmation screen.");
      return;
    }
    setPrefillBusy(true);
    setPrefillMsg(null);
    try {
      const res = await fetch("/api/vendors/eoi-by-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: raw }),
      });
      const data = (await res.json()) as {
        found?: boolean;
        prefill?: VendorRegistrationPrefill;
        summary_lines?: { label: string; value: string }[];
        reference_number?: string;
        service_location_pan_india?: boolean;
        service_location_madhya_pradesh?: boolean;
        service_location_indore?: boolean;
        service_location_other?: boolean;
        additional_service_locations?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setPrefillMsg(data.error ?? "Lookup failed.");
        setLinkedEoiReference(null);
        setEoiSummaryLines(null);
        return;
      }
      if (!data.found || !data.prefill || !data.summary_lines || !data.reference_number) {
        setPrefillMsg(data.error ?? "Could not load this EOI.");
        setLinkedEoiReference(null);
        setEoiSummaryLines(null);
        return;
      }
      applyPrefill(data.prefill);
      setF((p) => ({
        ...p,
        service_location_pan_india: data.service_location_pan_india ?? p.service_location_pan_india,
        service_location_madhya_pradesh: data.service_location_madhya_pradesh ?? p.service_location_madhya_pradesh,
        service_location_indore: data.service_location_indore ?? p.service_location_indore,
        service_location_other: data.service_location_other ?? p.service_location_other,
        additional_service_locations: data.additional_service_locations ?? p.additional_service_locations ?? "",
      }));
      setLinkedEoiReference(data.reference_number);
      setEoiSummaryLines(data.summary_lines);
      setPrefillMsg(
        "EOI linked. Fields you already submitted on the EOI are shown as a summary below — complete the remaining sections and submit.",
      );
    } catch {
      setPrefillMsg("Network error. Try again.");
      setLinkedEoiReference(null);
      setEoiSummaryLines(null);
    } finally {
      setPrefillBusy(false);
    }
  }

  function onPanIndia(v: boolean) {
    setF((p) => ({
      ...p,
      service_location_pan_india: v,
      service_location_madhya_pradesh: v ? true : p.service_location_madhya_pradesh,
      service_location_indore: v ? true : p.service_location_indore,
    }));
  }

  function setProgrammeIndore(checked: boolean) {
    setF((p) => ({
      ...p,
      service_location_indore: p.service_location_pan_india ? true : checked,
    }));
  }

  function setProgrammeMadhyaPradesh(checked: boolean) {
    setF((p) => {
      if (p.service_location_pan_india) {
        return { ...p, service_location_madhya_pradesh: true };
      }
      const next = { ...p, service_location_madhya_pradesh: checked };
      if (checked) {
        next.service_location_indore = true;
      }
      return next;
    });
  }

  /* eslint-disable react-hooks/set-state-in-effect -- IFSC field debounce: sync lookup state with code length/format */
  useEffect(() => {
    const code = f.ifsc_code.toUpperCase().replace(/\s/g, "");

    if (code.length === 0) {
      setIfscLookup(null);
      setIfscLookupBusy(false);
      return;
    }
    if (code.length < 11) {
      setIfscLookup(null);
      setIfscLookupBusy(false);
      return;
    }

    if (!IFSC_FORMAT_REGEX.test(code)) {
      setIfscLookup({ kind: "err", text: "Wrong IFSC code" });
      setIfscLookupBusy(false);
      return;
    }

    setIfscLookup(null);
    const ac = new AbortController();
    const timer = setTimeout(async () => {
      setIfscLookupBusy(true);
      try {
        const res = await fetch(`/api/bank/ifsc?code=${encodeURIComponent(code)}`, {
          signal: ac.signal,
        });
        const data = (await res.json()) as {
          valid?: boolean;
          bank_name?: string;
          branch_name?: string;
        };
        if (ac.signal.aborted) return;
        if (!res.ok || !data.valid) {
          setIfscLookup({ kind: "err", text: "Wrong IFSC code" });
          return;
        }
        setF((p) => ({
          ...p,
          ifsc_code: code,
          bank_name: data.bank_name ?? p.bank_name,
          branch_name: data.branch_name ?? p.branch_name,
        }));
        setIfscLookup({ kind: "ok", text: "Bank and branch name updated from IFSC." });
      } catch {
        if (ac.signal.aborted) return;
        setIfscLookup({ kind: "err", text: "Could not verify IFSC. Try again." });
      } finally {
        if (!ac.signal.aborted) setIfscLookupBusy(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [f.ifsc_code]);

  /* eslint-enable react-hooks/set-state-in-effect */

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidCategorySelectionsList(f.category_selections)) {
      setCategoryPickerError(true);
      setMsg({
        type: "err",
        text: "Under product / service details, select at least one broad industry and tick at least one vendor type under it.",
      });
      return;
    }
    setCategoryPickerError(false);
    setBusy(true);
    setMsg(null);
    try {
      const extra = f.additional_service_locations.trim();
      const body = {
        ...f,
        its_number: f.its_number.replace(/\D/g, "").length === 8 ? f.its_number.replace(/\D/g, "").slice(0, 8) : null,
        invitation_token: invitationToken.trim(),
        eoi_reference: linkedFromEoi && linkedEoiReference ? linkedEoiReference : "",
        aadhaar_linked_with_pan:
          f.aadhaar_linked_with_pan === "yes" || f.aadhaar_linked_with_pan === "no"
            ? f.aadhaar_linked_with_pan
            : "unknown",
        service_location_other: extra.length > 0,
        additional_service_locations: extra.length > 0 ? extra : null,
      };

      const res = await fetch("/api/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; details?: unknown };

      if (!res.ok) {
        const detail =
          typeof data.details === "object" && data.details !== null
            ? JSON.stringify(data.details)
            : data.error ?? "Submission failed";
        setMsg({ type: "err", text: detail });
        return;
      }

      setMsg({ type: "ok", text: "Registration submitted successfully. Our team will review your application." });
      setF(initial);
      setEoiRefInput("");
      setLinkedEoiReference(null);
      setEoiSummaryLines(null);
      setPrefillMsg(null);
      setIfscLookup(null);
    } catch {
      setMsg({ type: "err", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    const lines: string[] = ["Field,Value"];
    const entries: [string, string][] = [
      ["Vendor / company name", f.company_name],
      ["Vendor type", f.vendor_type],
      ["Constitution of business", f.constitution_of_business],
      ["Year of establishment", f.year_of_establishment],
      ["Registered address", f.registered_address],
      ["City", f.city],
      ["State", f.state],
      ["Country", f.country],
      ["PIN", f.pin_code],
      ["Primary contact", f.primary_contact_person],
      ["Designation", f.contact_designation],
      ["Mobile", f.mobile_number],
      ["Alternate mobile", f.alternate_mobile],
      ["Email", f.email],
      ["ITS (optional)", f.its_number],
      ["Website", f.website],
      ["PAN", f.pan_number],
      ["GST registered", f.gst_registered ? "Yes" : "No"],
      ["GSTIN", f.gstin],
      ["MSME registered", f.msme_registered ? "Yes" : "No"],
      ["MSME number", f.msme_udyam_number],
      ["Bank", f.bank_name],
      ["Branch", f.branch_name],
      ["Account holder", f.account_holder_name],
      ["Account number", f.account_number],
      ["IFSC", f.ifsc_code],
      ["Account type", f.account_type],
      ["Products / services", f.products_services_offered],
      ["Additional locations", f.additional_service_locations],
      ["Turnover FY23-24", f.turnover_fy_2023_24],
      ["Turnover FY24-25", f.turnover_fy_2024_25],
      ["Turnover FY25-26", f.turnover_fy_2025_26],
    ];
    for (const [k, v] of entries) {
      lines.push(`${csvEscapeCell(k)},${csvEscapeCell(v)}`);
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor-registration-${new Date().toISOString().slice(0, 10)}.csv`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <form
      id="vendor-registration-form"
      onSubmit={onSubmit}
      className="vendor-registration-print-root mx-auto max-w-4xl space-y-4 pb-24"
    >
      <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white p-5 text-sm text-amber-950 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:to-zinc-950 dark:text-amber-50">
        <p className="font-semibold text-base">This form is not saved until you submit successfully</p>
        <p className="mt-2 leading-relaxed text-amber-900/90 dark:text-amber-100/90">
          If you close or refresh the page, your entries may be lost. Use <strong>Download CSV</strong> or print / save
          as PDF before closing. Data is stored only after <strong>Submit registration</strong> completes.
        </p>
      </div>

      {!hasInvite ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/80">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Link your Expression of Interest (optional)</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              After you submit an EOI, you receive a <strong>reference ID</strong> (for example{" "}
              <span className="font-mono text-zinc-800 dark:text-zinc-200">EOI-2026-A1B2C3</span>). Enter it here to
              pull your details and skip questions you already answered on the EOI. Your email, mobile (+91), and PAN on
              this form must match the EOI — we verify them when you submit.
            </p>
          </div>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className={labelClass()}>EOI reference ID</label>
              <input
                className={inputClass() + " font-mono tracking-wide"}
                autoComplete="off"
                spellCheck={false}
                value={eoiRefInput}
                onChange={(e) => setEoiRefInput(e.target.value.toUpperCase())}
                placeholder="EOI-2026-XXXXXX"
                disabled={!!linkedEoiReference}
              />
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {linkedEoiReference ? (
                <button
                  type="button"
                  onClick={() => {
                    setLinkedEoiReference(null);
                    setEoiSummaryLines(null);
                    setPrefillMsg(null);
                    setEoiRefInput("");
                    setF(initial);
                    setCategoryPickerError(false);
                    setIfscLookup(null);
                  }}
                  className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Unlink &amp; start fresh
                </button>
              ) : (
                <button
                  type="button"
                  disabled={prefillBusy}
                  onClick={() => void fetchEoiByReference()}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
                >
                  {prefillBusy ? "Looking up…" : "Load from EOI"}
                </button>
              )}
            </div>
          </div>
          {prefillMsg ? <p className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">{prefillMsg}</p> : null}
        </div>
      ) : null}

      {linkedFromEoi && eoiSummaryLines ? (
        <section className="overflow-hidden rounded-xl border border-emerald-200/80 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-zinc-900">
          <div className="border-b border-emerald-100 bg-emerald-50/60 px-5 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">From your Expression of Interest</p>
            <p className="mt-0.5 text-xs text-emerald-900/80 dark:text-emerald-200/80">
              The following was submitted on your EOI and is locked for this registration. Contact the committee if any
              detail needs a correction.
            </p>
          </div>
          <dl className="grid gap-x-6 gap-y-3 p-5 sm:grid-cols-2">
            {eoiSummaryLines.map((row) => (
              <div key={row.label} className={row.label.includes("Capability") || row.label.includes("Address") ? "sm:col-span-2" : ""}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{row.label}</dt>
                <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {!linkedFromEoi ? (
        <>
          <SectionTitle n={1} title="Vendor basic details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass()}>Vendor / company name *</label>
              <input
                required
                className={inputClass()}
                value={f.company_name}
                onChange={(e) => set("company_name", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass()}>Vendor type *</label>
              <select
                required
                className={inputClass()}
                value={f.vendor_type}
                onChange={(e) => set("vendor_type", e.target.value)}
              >
                <option value="">Select</option>
                <option>Goods supplier</option>
                <option>Service provider</option>
                <option>Goods &amp; services</option>
                <option>Works / contractor</option>
                <option>Consultant</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass()}>Constitution of business *</label>
              <select
                required
                className={inputClass()}
                value={f.constitution_of_business}
                onChange={(e) => set("constitution_of_business", e.target.value)}
              >
                <option value="">Select</option>
                <option>Proprietorship</option>
                <option>Partnership firm</option>
                <option>LLP</option>
                <option>Private limited</option>
                <option>Public limited</option>
                <option>One person company</option>
                <option>Trust / society</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass()}>Year of establishment</label>
              <input
                type="number"
                min={1800}
                max={2100}
                className={inputClass()}
                value={f.year_of_establishment}
                onChange={(e) => set("year_of_establishment", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Registered address *</label>
              <textarea
                required
                rows={3}
                className={inputClass()}
                value={f.registered_address}
                onChange={(e) => set("registered_address", e.target.value)}
                placeholder="Complete registered address"
              />
            </div>
            <div>
              <label className={labelClass()}>City *</label>
              <input required className={inputClass()} value={f.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>State *</label>
              <input required className={inputClass()} value={f.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div>
              <label className={labelClass()}>Country *</label>
              <input
                required
                className={inputClass()}
                value={f.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass()}>PIN code *</label>
              <input
                required
                pattern="\d{6}"
                className={inputClass()}
                value={f.pin_code}
                onChange={(e) => set("pin_code", e.target.value)}
              />
              <p className="mt-1 text-xs text-zinc-500">For Indore, default PIN 452001 (editable).</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <SectionTitle title="Classification & registered office (PIN)" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Vendor type was not part of the EOI. PIN and country complete your registered-office line for statutory
            records.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Vendor type *</label>
              <select
                required
                className={inputClass()}
                value={f.vendor_type}
                onChange={(e) => set("vendor_type", e.target.value)}
              >
                <option value="">Select</option>
                <option>Goods supplier</option>
                <option>Service provider</option>
                <option>Goods &amp; services</option>
                <option>Works / contractor</option>
                <option>Consultant</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass()}>Country *</label>
              <input
                required
                className={inputClass()}
                value={f.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>PIN code * (6 digits)</label>
              <input
                required
                pattern="\d{6}"
                className={inputClass()}
                value={f.pin_code}
                onChange={(e) => set("pin_code", e.target.value)}
              />
              <p className="mt-1 text-xs text-zinc-500">Not collected on the EOI — enter your registered office PIN.</p>
            </div>
          </div>
        </>
      )}

      {!linkedFromEoi ? (
        <>
          <SectionTitle n={2} title="Contact details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Primary contact person *</label>
              <input
                required
                className={inputClass()}
                value={f.primary_contact_person}
                onChange={(e) => set("primary_contact_person", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass()}>Designation</label>
              <input
                className={inputClass()}
                value={f.contact_designation}
                onChange={(e) => set("contact_designation", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass()}>Mobile number * (+91 + 10 digits)</label>
              <input
                required
                className={inputClass()}
                value={f.mobile_number}
                onChange={(e) => set("mobile_number", e.target.value)}
                placeholder="+919876543210"
              />
            </div>
            <div>
              <label className={labelClass()}>Alternate mobile</label>
              <input
                className={inputClass()}
                value={f.alternate_mobile}
                onChange={(e) => set("alternate_mobile", e.target.value)}
                placeholder="+91"
              />
            </div>
            <div>
              <label className={labelClass()}>Email ID *</label>
              <input
                required
                type="email"
                className={inputClass()}
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@gmail.com"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Use a full valid address (for example <span className="font-mono">name@gmail.com</span>) or your
                organisation domain.
              </p>
            </div>
            <div>
              <label className={labelClass()}>ITS number (optional)</label>
              <input
                className={inputClass()}
                inputMode="numeric"
                maxLength={8}
                value={f.its_number}
                onChange={(e) => set("its_number", e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="8 digits, community members only"
              />
              <p className="mt-1 text-xs text-zinc-500">Leave blank if not applicable.</p>
            </div>
            <div>
              <label className={labelClass()}>Website</label>
              <input
                className={inputClass()}
                value={f.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <SectionTitle title="Optional contact additions" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Primary contact, mobile, email, and ITS on your EOI are fixed for this registration. Add an alternate number
            or website if you wish.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Alternate mobile</label>
              <input
                className={inputClass()}
                value={f.alternate_mobile}
                onChange={(e) => set("alternate_mobile", e.target.value)}
                placeholder="+91"
              />
            </div>
            <div>
              <label className={labelClass()}>Website</label>
              <input
                className={inputClass()}
                value={f.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </>
      )}

      {!linkedFromEoi ? (
        <>
          <SectionTitle n={3} title="Statutory / tax details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>PAN number *</label>
              <input
                required
                className={inputClass()}
                value={f.pan_number}
                onChange={(e) => setF((p) => applyPanChange(p, e.target.value))}
                maxLength={10}
              />
            </div>
            <div>
              <label className={labelClass()}>GST registered? *</label>
              <select
                required
                className={inputClass()}
                value={f.gst_registered ? "yes" : "no"}
                onChange={(e) => {
                  const yes = e.target.value === "yes";
                  if (!yes) {
                    set("gst_registered", false);
                    set("gstin", "");
                    set("doc_gst_certificate", false);
                    return;
                  }
                  setF((prev) => {
                    const pan = prev.pan_number.toUpperCase().replace(/\s/g, "");
                    const gstin =
                      validatePAN(pan) ? buildGstinPrefix(pan, DEFAULT_GST_STATE_CODE) : prev.gstin;
                    return { ...prev, gst_registered: true, gstin };
                  });
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              <p className="mt-1 text-xs text-zinc-500">GST stays “No” until you choose Yes; a valid PAN helps pre-fill GSTIN.</p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>GSTIN</label>
              <input
                disabled={!f.gst_registered}
                className={inputClass() + (f.gst_registered ? "" : " opacity-60")}
                value={f.gstin}
                maxLength={15}
                onChange={(e) => set("gstin", e.target.value.toUpperCase())}
                placeholder={f.gst_registered ? "Enter full 15-character GSTIN" : ""}
              />
              {f.gst_registered ? (
                <p className="mt-1 text-xs text-zinc-500">
                  The first 12 characters are suggested from your PAN and state 23 (Madhya Pradesh). Enter the final three
                  characters yourself; they are not auto-filled. Replace the whole GSTIN if yours differs.
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClass()}>MSME registered?</label>
              <select
                className={inputClass()}
                value={f.msme_registered ? "yes" : "no"}
                onChange={(e) => {
                  const yes = e.target.value === "yes";
                  set("msme_registered", yes);
                  if (!yes) {
                    set("msme_udyam_number", "");
                    set("doc_msme_certificate", false);
                  }
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className={labelClass()}>MSME / Udyam number</label>
              <input
                disabled={!f.msme_registered}
                className={inputClass() + (f.msme_registered ? "" : " opacity-60")}
                value={f.msme_udyam_number}
                onChange={(e) => set("msme_udyam_number", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass()}>TAN number, if applicable</label>
              <input className={inputClass()} value={f.tan_number} onChange={(e) => set("tan_number", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>TDS applicability (notes)</label>
              <input
                className={inputClass()}
                value={f.tds_applicability}
                onChange={(e) => set("tds_applicability", e.target.value)}
                placeholder="As applicable"
              />
              <p className="mt-1 text-xs text-zinc-500">
                TDS shall be deducted wherever applicable as per prevailing statutory norms. If PAN and Aadhaar are not
                linked, higher TDS shall be deducted as per applicable norms.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Is Aadhaar linked with PAN? *</label>
              <select
                required
                className={inputClass()}
                value={f.aadhaar_linked_with_pan}
                onChange={(e) => set("aadhaar_linked_with_pan", e.target.value as FormState["aadhaar_linked_with_pan"])}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unknown">Unknown / pending verification</option>
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                If PAN and Aadhaar are not linked, higher TDS shall be deducted as per applicable norms.
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <SectionTitle title="Additional statutory details" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            PAN, GST, and MSME were captured on your EOI. Provide TAN and TDS notes if applicable, and confirm Aadhaar–PAN
            linking for withholding tax purposes.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>MSME / Udyam number</label>
              <input
                disabled={!f.msme_registered}
                className={inputClass() + (f.msme_registered ? "" : " opacity-60")}
                value={f.msme_udyam_number}
                onChange={(e) => set("msme_udyam_number", e.target.value)}
                placeholder={f.msme_registered ? "Enter Udyam registration number" : ""}
              />
              <p className="mt-1 text-xs text-zinc-500">
                {f.msme_registered
                  ? "The EOI only recorded MSME status — enter your Udyam number if registered."
                  : "Not applicable (MSME not registered on EOI)."}
              </p>
            </div>
            <div>
              <label className={labelClass()}>TAN number, if applicable</label>
              <input className={inputClass()} value={f.tan_number} onChange={(e) => set("tan_number", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>TDS applicability (notes)</label>
              <input
                className={inputClass()}
                value={f.tds_applicability}
                onChange={(e) => set("tds_applicability", e.target.value)}
                placeholder="As applicable"
              />
              <p className="mt-1 text-xs text-zinc-500">
                TDS shall be deducted wherever applicable as per prevailing statutory norms. If PAN and Aadhaar are not
                linked, higher TDS shall be deducted as per applicable norms.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Is Aadhaar linked with PAN? *</label>
              <select
                required
                className={inputClass()}
                value={f.aadhaar_linked_with_pan}
                onChange={(e) => set("aadhaar_linked_with_pan", e.target.value as FormState["aadhaar_linked_with_pan"])}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unknown">Unknown / pending verification</option>
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                If PAN and Aadhaar are not linked, higher TDS shall be deducted as per applicable norms.
              </p>
            </div>
          </div>
        </>
      )}

      <SectionTitle n={4} title="Bank details" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        After you enter all 11 characters of the IFSC, bank and branch names are filled automatically (Razorpay / RBI
        directory). Invalid codes show an error below.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass()}>IFSC code *</label>
          <div className="relative max-w-md">
            <input
              required
              className={inputClass() + (ifscLookupBusy ? " pr-20" : "")}
              value={f.ifsc_code}
              onChange={(e) => set("ifsc_code", e.target.value.toUpperCase())}
              maxLength={11}
              placeholder="e.g. HDFC0001234"
              autoComplete="off"
            />
            {ifscLookupBusy ? (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                Checking…
              </span>
            ) : null}
          </div>
          {ifscLookup ? (
            <p
              className={
                ifscLookup.kind === "ok"
                  ? "mt-2 text-xs text-emerald-800 dark:text-emerald-300"
                  : "mt-2 text-xs text-red-700 dark:text-red-400"
              }
            >
              {ifscLookup.text}
            </p>
          ) : null}
        </div>
        <div>
          <label className={labelClass()}>Bank name *</label>
          <input required className={inputClass()} value={f.bank_name} onChange={(e) => set("bank_name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass()}>Branch name *</label>
          <input
            required
            className={inputClass()}
            value={f.branch_name}
            onChange={(e) => set("branch_name", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Account holder name *</label>
          <input
            required
            className={inputClass()}
            value={f.account_holder_name}
            onChange={(e) => set("account_holder_name", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()}>Account number * (numeric)</label>
          <input
            required
            pattern="\d{6,18}"
            className={inputClass()}
            value={f.account_number}
            onChange={(e) => set("account_number", e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div>
          <label className={labelClass()}>Account type *</label>
          <select
            required
            className={inputClass()}
            value={f.account_type}
            onChange={(e) => set("account_type", e.target.value)}
          >
            <option value="">Select</option>
            <option>Current</option>
            <option>Savings</option>
            <option>Cash credit</option>
            <option>Overdraft</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      {!linkedFromEoi ? (
        <>
          <SectionTitle n={5} title="Product / service details" />
          <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass()}>Categories you supply *</label>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Tick every broad industry that applies and all vendor types you offer under each. You may choose several
            industries and several types within one industry.
          </p>
          <CategorySelectionsPicker
            value={f.category_selections}
            onChange={(next) => {
              setCategoryPickerError(false);
              setF((p) => ({ ...p, category_selections: next }));
            }}
            variant="vendor"
            error={categoryPickerError}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Products / services offered *</label>
          <textarea
            required
            rows={3}
            className={inputClass()}
            value={f.products_services_offered}
            onChange={(e) => set("products_services_offered", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 rounded-lg border border-zinc-200 bg-zinc-50/90 p-4 dark:border-zinc-600 dark:bg-zinc-900/50">
          <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Geographic coverage
          </p>
          <h3 className="mb-2 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Programme supply area
          </h3>
          <p className="mx-auto mb-4 max-w-2xl text-center text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            For Ashara Mubaraka 1448H (Indore Araz), <strong className="text-zinc-800 dark:text-zinc-200">every</strong>{" "}
            registered vendor must be able to supply for this programme in <strong>Indore</strong> and across{" "}
            <strong>Madhya Pradesh</strong>. Tick both boxes below to confirm that applies to your organisation.
          </p>

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Confirm for this programme (both required) *
          </p>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Select all that apply — both must be ticked unless you choose PAN India.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-[4.5rem] cursor-pointer items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-950">
              <input
                type="checkbox"
                className="mt-0.5 accent-emerald-600"
                required={!f.service_location_pan_india}
                disabled={f.service_location_pan_india}
                checked={f.service_location_indore}
                onChange={(e) => setProgrammeIndore(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">Indore</span>
                <span className="mt-1 block text-xs font-normal leading-snug text-zinc-600 dark:text-zinc-400">
                  {f.service_location_pan_india
                    ? "Covered under PAN India."
                    : "We can supply goods or services for this programme within Indore city."}
                </span>
              </span>
            </label>
            <label className="flex min-h-[4.5rem] cursor-pointer items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-950">
              <input
                type="checkbox"
                className="mt-0.5 accent-emerald-600"
                required={!f.service_location_pan_india}
                disabled={f.service_location_pan_india}
                checked={f.service_location_madhya_pradesh}
                onChange={(e) => setProgrammeMadhyaPradesh(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">Madhya Pradesh</span>
                <span className="mt-1 block text-xs font-normal leading-snug text-zinc-600 dark:text-zinc-400">
                  {f.service_location_pan_india
                    ? "Covered under PAN India."
                    : "We can supply goods or services for this programme across Madhya Pradesh (statewide), not only Indore."}
                </span>
              </span>
            </label>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md border border-dashed border-zinc-300 bg-white/80 p-3 text-sm dark:border-zinc-600 dark:bg-zinc-950/80">
            <input
              type="checkbox"
              className="mt-0.5 accent-emerald-600"
              checked={f.service_location_pan_india}
              onChange={(e) => onPanIndia(e.target.checked)}
            />
            <span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">PAN India</span>
              <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-400">
                Optional — we also operate across India. Selecting this automatically satisfies Indore and Madhya
                Pradesh above.
              </span>
            </span>
          </label>
          <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
            If PAN India is selected, Madhya Pradesh and Indore are treated as applicable. If only Madhya Pradesh is
            selected, Indore is automatically included for this programme.
          </p>

          <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Other locations (optional)
            </p>
            <label className={labelClass()}>Additional cities, districts, or regions you can supply</label>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Not required. Use this to tell us where else you can work beyond the programme requirement (for example
              neighbouring states or specific towns). One per line or comma-separated is fine.
            </p>
            <textarea
              rows={3}
              maxLength={2000}
              className={inputClass()}
              value={f.additional_service_locations}
              onChange={(e) => set("additional_service_locations", e.target.value)}
              placeholder="e.g. Bhopal, Ujjain, Dewas; Rajasthan for certain materials only"
            />
            <p className="mt-0.5 text-right text-[11px] text-zinc-400">{f.additional_service_locations.length}/2000</p>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Annual turnover — last three years</label>
          <p className="mb-2 text-xs text-zinc-500">
            Enter amounts as digits (commas optional). On blur, values format in Indian style (e.g. 10000000 →
            1,00,00,000).
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <span className="text-xs text-zinc-500">FY 2023-24</span>
              <input
                className={inputClass()}
                value={f.turnover_fy_2023_24}
                onChange={(e) => set("turnover_fy_2023_24", e.target.value)}
                onBlur={() => set("turnover_fy_2023_24", formatIndianNumberDisplay(f.turnover_fy_2023_24))}
                placeholder="e.g. 10000000"
              />
            </div>
            <div>
              <span className="text-xs text-zinc-500">FY 2024-25</span>
              <input
                className={inputClass()}
                value={f.turnover_fy_2024_25}
                onChange={(e) => set("turnover_fy_2024_25", e.target.value)}
                onBlur={() => set("turnover_fy_2024_25", formatIndianNumberDisplay(f.turnover_fy_2024_25))}
              />
            </div>
            <div>
              <span className="text-xs text-zinc-500">FY 2025-26</span>
              <input
                className={inputClass()}
                value={f.turnover_fy_2025_26}
                onChange={(e) => set("turnover_fy_2025_26", e.target.value)}
                onBlur={() => set("turnover_fy_2025_26", formatIndianNumberDisplay(f.turnover_fy_2025_26))}
              />
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass()}>Expected credit period</label>
          <select
            className={inputClass()}
            value={f.expected_credit_period}
            onChange={(e) => set("expected_credit_period", e.target.value)}
          >
            <option value="">Select</option>
            <option>7 days</option>
            <option>15 days</option>
            <option>30 days</option>
            <option>45 days</option>
            <option>60 days</option>
            <option>90 days</option>
            <option>Other / as per PO</option>
          </select>
        </div>
      </div>
        </>
      ) : (
        <>
          <SectionTitle title="Financial details & programme coverage" />
          <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50/90 p-4 text-sm dark:border-zinc-600 dark:bg-zinc-900/50">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">Aligned with your EOI</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Broad industries, vendor types, capability text, and programme geography were submitted on your Expression
              of Interest and are stored with this registration. Enter <strong>exact annual figures</strong> below (not
              collected on the EOI).
            </p>
            <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <li className="rounded-md bg-white px-3 py-2 dark:bg-zinc-950">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Indore (programme)</span>
                <span className="text-zinc-600 dark:text-zinc-400"> — {f.service_location_indore ? "Yes" : "No"}</span>
              </li>
              <li className="rounded-md bg-white px-3 py-2 dark:bg-zinc-950">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Madhya Pradesh</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {" "}
                  — {f.service_location_madhya_pradesh ? "Yes" : "No"}
                </span>
              </li>
              <li className="rounded-md bg-white px-3 py-2 dark:bg-zinc-950">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">PAN India</span>
                <span className="text-zinc-600 dark:text-zinc-400"> — {f.service_location_pan_india ? "Yes" : "No"}</span>
              </li>
              <li className="rounded-md bg-white px-3 py-2 dark:bg-zinc-950">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Other locations noted</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {" "}
                  — {f.service_location_other && f.additional_service_locations.trim() ? "Yes (see EOI summary)" : "No"}
                </span>
              </li>
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass()}>Annual turnover — last three years</label>
              <p className="mb-2 text-xs text-zinc-500">
                Enter amounts as digits (commas optional). On blur, values format in Indian style (e.g. 10000000 →
                1,00,00,000).
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <span className="text-xs text-zinc-500">FY 2023-24</span>
                  <input
                    className={inputClass()}
                    value={f.turnover_fy_2023_24}
                    onChange={(e) => set("turnover_fy_2023_24", e.target.value)}
                    onBlur={() => set("turnover_fy_2023_24", formatIndianNumberDisplay(f.turnover_fy_2023_24))}
                    placeholder="e.g. 10000000"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500">FY 2024-25</span>
                  <input
                    className={inputClass()}
                    value={f.turnover_fy_2024_25}
                    onChange={(e) => set("turnover_fy_2024_25", e.target.value)}
                    onBlur={() => set("turnover_fy_2024_25", formatIndianNumberDisplay(f.turnover_fy_2024_25))}
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500">FY 2025-26</span>
                  <input
                    className={inputClass()}
                    value={f.turnover_fy_2025_26}
                    onChange={(e) => set("turnover_fy_2025_26", e.target.value)}
                    onBlur={() => set("turnover_fy_2025_26", formatIndianNumberDisplay(f.turnover_fy_2025_26))}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass()}>Expected credit period</label>
              <select
                className={inputClass()}
                value={f.expected_credit_period}
                onChange={(e) => set("expected_credit_period", e.target.value)}
              >
                <option value="">Select</option>
                <option>7 days</option>
                <option>15 days</option>
                <option>30 days</option>
                <option>45 days</option>
                <option>60 days</option>
                <option>90 days</option>
                <option>Other / as per PO</option>
              </select>
            </div>
          </div>
        </>
      )}

      <SectionTitle n={6} title="Existing client / reference details" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass()}>Reference 1 name</label>
          <input className={inputClass()} value={f.reference_1_name} onChange={(e) => set("reference_1_name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass()}>Reference 1 contact</label>
          <input
            className={inputClass()}
            value={f.reference_1_contact}
            onChange={(e) => set("reference_1_contact", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()}>Reference 2 name</label>
          <input className={inputClass()} value={f.reference_2_name} onChange={(e) => set("reference_2_name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass()}>Reference 2 contact</label>
          <input
            className={inputClass()}
            value={f.reference_2_contact}
            onChange={(e) => set("reference_2_contact", e.target.value)}
          />
        </div>
      </div>

      <SectionTitle n={7} title="Documents checklist" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Tick to confirm you will provide / have attached mandatory documents. GST and MSME certificates stay disabled
        unless registered.
      </p>
      <div className="space-y-2 text-sm">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={f.doc_pan_card}
            onChange={(e) => set("doc_pan_card", e.target.checked)}
            required
          />
          <span>PAN card *</span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={f.doc_cancelled_cheque}
            onChange={(e) => set("doc_cancelled_cheque", e.target.checked)}
            required
          />
          <span>Cancelled cheque *</span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={f.doc_address_proof}
            onChange={(e) => set("doc_address_proof", e.target.checked)}
            required
          />
          <span>Address proof *</span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={f.doc_company_registration}
            onChange={(e) => set("doc_company_registration", e.target.checked)}
            required
          />
          <span>Company / firm registration certificate *</span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            disabled={!f.gst_registered}
            checked={f.doc_gst_certificate}
            onChange={(e) => set("doc_gst_certificate", e.target.checked)}
          />
          <span>GST certificate {f.gst_registered ? "" : "(enable GST registration)"}</span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            disabled={!f.msme_registered}
            checked={f.doc_msme_certificate}
            onChange={(e) => set("doc_msme_certificate", e.target.checked)}
          />
          <span>MSME / Udyam certificate {f.msme_registered ? "" : "(enable MSME registration)"}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={f.doc_other} onChange={(e) => set("doc_other", e.target.checked)} />
          <span>Other documents</span>
        </label>
        {f.doc_other ? (
          <div>
            <label className={labelClass()}>Other documents description</label>
            <input
              className={inputClass()}
              value={f.doc_other_description}
              onChange={(e) => set("doc_other_description", e.target.value)}
            />
          </div>
        ) : null}
      </div>

      <SectionTitle n={8} title="Policy matters, Do&apos;s &amp; Don&apos;ts, and FAQ" />
      <div className="max-h-[min(28rem,70vh)] space-y-4 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200">
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Vendor registration policy</p>
          <p className="mt-1 leading-relaxed">{VENDOR_REGISTRATION_POLICY_INTRO}</p>
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">TDS policy</p>
          <p className="mt-1 leading-relaxed">{VENDOR_TDS_POLICY}</p>
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Do&apos;s</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {VENDOR_DOS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Don&apos;ts</p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {VENDOR_DONTS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">FAQ</p>
          <ul className="mt-1 list-inside list-disc space-y-2">
            {VENDOR_FAQ.map((item) => (
              <li key={item.q}>
                <span className="font-medium">{item.q}</span> {item.a}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Policy matters</p>
          <p className="mt-1 leading-relaxed">{VENDOR_POLICY_MATTERS}</p>
        </div>
        <label className="flex items-start gap-2 border-t border-zinc-200 pt-3 font-medium dark:border-zinc-700">
          <input
            type="checkbox"
            checked={f.policy_accepted}
            onChange={(e) => set("policy_accepted", e.target.checked)}
            required
          />
          <span>{VENDOR_POLICY_ACCEPTANCE_LABEL} *</span>
        </label>
      </div>

      <SectionTitle n={9} title="Declaration" />
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        I / we hereby declare that the information provided above is true and correct to the best of my / our
        knowledge. I / we agree to comply with the organisation&apos;s procurement, billing, tax, documentation, and
        payment procedures. I / we understand that submission of this form does not guarantee vendor approval or
        business allocation.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass()}>Authorised person name *</label>
          <input
            required
            className={inputClass()}
            value={f.declaration_authorized_person_name}
            onChange={(e) => set("declaration_authorized_person_name", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()}>Designation *</label>
          <input
            required
            className={inputClass()}
            value={f.declaration_designation}
            onChange={(e) => set("declaration_designation", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()}>Date *</label>
          <input
            required
            type="date"
            className={inputClass()}
            value={f.declaration_date}
            onChange={(e) => set("declaration_date", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()}>Place *</label>
          <input
            required
            className={inputClass()}
            value={f.declaration_place}
            onChange={(e) => set("declaration_place", e.target.value)}
          />
        </div>
      </div>

      {msg ? (
        <div
          className={
            msg.type === "ok"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
              : "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
          }
        >
          {msg.type === "err" ? <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre> : msg.text}
        </div>
      ) : null}

      <div className="print:hidden sticky bottom-0 flex flex-wrap gap-3 border-t border-zinc-200 bg-white/90 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit registration"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          onClick={downloadCsv}
        >
          Download CSV (Excel)
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          onClick={() => {
            setF(initial);
            setMsg(null);
            setEoiRefInput(initialEoiReference.trim());
            setLinkedEoiReference(null);
            setEoiSummaryLines(null);
            setPrefillMsg(null);
            setIfscLookup(null);
            setCategoryPickerError(false);
          }}
        >
          Reset form
        </button>
      </div>
    </form>
  );
}
