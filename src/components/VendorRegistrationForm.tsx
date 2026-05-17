"use client";

import { useEffect, useState } from "react";
import { ItsNumberGate } from "@/components/ItsNumberGate";

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
  main_category: string;
  sub_category: string;
  products_services_offered: string;
  service_location_pan_india: boolean;
  service_location_madhya_pradesh: boolean;
  service_location_indore: boolean;
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
  main_category: "",
  sub_category: "",
  products_services_offered: "",
  service_location_pan_india: false,
  service_location_madhya_pradesh: true,
  service_location_indore: true,
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

function SectionTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="mt-10 border-b border-zinc-200 pb-2 text-lg font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
      <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
        {n}
      </span>
      {title}
    </h2>
  );
}

export function VendorRegistrationForm({ invitationToken }: { invitationToken: string }) {
  const [f, setF] = useState<FormState>(initial);
  const [formUnlocked, setFormUnlocked] = useState(false);
  const [itsNumber, setItsNumber] = useState("");
  const [itsError, setItsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [ifscLookupBusy, setIfscLookupBusy] = useState(false);
  const [ifscLookup, setIfscLookup] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((p) => ({ ...p, [key]: value }));
  }

  function unlockForm(digits: string) {
    setItsNumber(digits);
    setItsError(null);
    setFormUnlocked(true);
  }

  function continueFromIts() {
    const digits = itsNumber.replace(/\D/g, "");
    if (digits.length > 0 && digits.length !== 8) {
      setItsError("ITS number must be exactly 8 digits, or leave blank if you are not from our community.");
      return;
    }
    unlockForm(digits);
  }

  function skipIts() {
    unlockForm("");
  }

  function onPanIndia(v: boolean) {
    setF((p) => ({
      ...p,
      service_location_pan_india: v,
      service_location_madhya_pradesh: v ? true : p.service_location_madhya_pradesh,
      service_location_indore: v ? true : p.service_location_indore,
    }));
  }

  function setIndoreMadhyaCoverage(v: boolean) {
    setF((p) => ({
      ...p,
      service_location_indore: v,
      service_location_madhya_pradesh: v,
      service_location_pan_india: v ? p.service_location_pan_india : false,
    }));
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
    setBusy(true);
    setMsg(null);
    try {
      const extra = f.additional_service_locations.trim();
      const body = {
        ...f,
        its_number: itsNumber.trim() ? itsNumber.replace(/\D/g, "") : null,
        invitation_token: invitationToken,
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
      setFormUnlocked(false);
      setItsNumber("");
      setItsError(null);
      setIfscLookup(null);
    } catch {
      setMsg({ type: "err", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  if (!formUnlocked) {
    return (
      <ItsNumberGate
        value={itsNumber}
        onChange={setItsNumber}
        onContinue={continueFromIts}
        onSkip={skipIts}
        error={itsError}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-2 pb-24">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/50">
        <span className="text-zinc-700 dark:text-zinc-300">
          {itsNumber ? (
            <>
              ITS number: <strong className="tabular-nums">{itsNumber}</strong>
            </>
          ) : (
            "Continuing without ITS number"
          )}
        </span>
        <button
          type="button"
          className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          onClick={() => setFormUnlocked(false)}
        >
          Change ITS
        </button>
      </div>
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
        Important: data is saved to the organisation database when you submit. Keep statutory documents ready;
        mandatory document checkboxes confirm you will provide uploads when requested.
      </p>

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

      <SectionTitle n={3} title="Statutory / tax details" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass()}>PAN number *</label>
          <input
            required
            className={inputClass()}
            value={f.pan_number}
            onChange={(e) => set("pan_number", e.target.value.toUpperCase())}
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
              set("gst_registered", yes);
              if (!yes) {
                set("gstin", "");
                set("doc_gst_certificate", false);
              }
            }}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
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
            <p className="mt-1 text-xs text-zinc-500">Enter your complete GSTIN manually (not derived from PAN).</p>
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
        <div>
          <label className={labelClass()}>TDS applicability (notes)</label>
          <input
            className={inputClass()}
            value={f.tds_applicability}
            onChange={(e) => set("tds_applicability", e.target.value)}
            placeholder="As applicable"
          />
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
        </div>
      </div>

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

      <SectionTitle n={5} title="Product / service details" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass()}>Main category *</label>
          <input
            required
            className={inputClass()}
            value={f.main_category}
            onChange={(e) => set("main_category", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass()}>Sub category</label>
          <input className={inputClass()} value={f.sub_category} onChange={(e) => set("sub_category", e.target.value)} />
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
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Geographic coverage
          </p>
          <label className={labelClass()}>Cities / areas you can operate in *</label>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            All vendors for this programme must be able to supply in <strong>Indore, Madhya Pradesh</strong>. Use the
            optional field below to list any further cities, districts, or regions you can also serve.
          </p>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-600 dark:bg-zinc-950">
            <input
              type="checkbox"
              required
              className="mt-0.5 accent-emerald-600"
              checked={f.service_location_indore && f.service_location_madhya_pradesh}
              disabled={f.service_location_pan_india}
              onChange={(e) => setIndoreMadhyaCoverage(e.target.checked)}
            />
            <span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">Indore, Madhya Pradesh</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-600 dark:text-zinc-400">
                {f.service_location_pan_india
                  ? "Included because you selected PAN India below."
                  : "Required — I / we can supply goods or services for this programme in Indore and across Madhya Pradesh."}
              </span>
            </span>
          </label>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-emerald-600"
              checked={f.service_location_pan_india}
              onChange={(e) => onPanIndia(e.target.checked)}
            />
            <span>
              <span className="font-medium">PAN India</span>
              <span className="text-zinc-600 dark:text-zinc-400"> — also serve locations across India (includes Indore &amp; MP)</span>
            </span>
          </label>
          <div className="mt-4">
            <label className={labelClass()}>Other cities or areas you can supply (optional)</label>
            <p className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              List any extra towns, districts, states, or regions (one per line or comma-separated). Leave blank if
              only Indore / MP (or PAN India) applies.
            </p>
            <textarea
              rows={3}
              maxLength={2000}
              className={inputClass()}
              value={f.additional_service_locations}
              onChange={(e) => set("additional_service_locations", e.target.value)}
              placeholder="e.g. Bhopal, Ujjain, Dewas; or Maharashtra for specific categories only"
            />
            <p className="mt-0.5 text-right text-[11px] text-zinc-400">{f.additional_service_locations.length}/2000</p>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass()}>Annual turnover — last three years</label>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <span className="text-xs text-zinc-500">FY 2023-24</span>
              <input
                className={inputClass()}
                value={f.turnover_fy_2023_24}
                onChange={(e) => set("turnover_fy_2023_24", e.target.value)}
                placeholder="e.g. 10000000"
              />
            </div>
            <div>
              <span className="text-xs text-zinc-500">FY 2024-25</span>
              <input
                className={inputClass()}
                value={f.turnover_fy_2024_25}
                onChange={(e) => set("turnover_fy_2024_25", e.target.value)}
              />
            </div>
            <div>
              <span className="text-xs text-zinc-500">FY 2025-26</span>
              <input
                className={inputClass()}
                value={f.turnover_fy_2025_26}
                onChange={(e) => set("turnover_fy_2025_26", e.target.value)}
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

      <SectionTitle n={8} title="Policy matters" />
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200">
        <p className="mb-2 font-medium">Vendor registration policy</p>
        <p className="mb-3">
          Registration is subject to verification of documents, bank details, suitability, pricing discipline, conduct,
          and management approval. Submission does not guarantee approval, purchase orders, or allocation. Payments are
          processed only per approved terms, invoices, compliance, and satisfactory delivery.
        </p>
        <p className="mb-2 font-medium">TDS policy</p>
        <p className="mb-3">
          TDS is deducted wherever applicable. If PAN and Aadhaar are not linked, higher TDS may apply per statutory
          norms.
        </p>
        <label className="mt-2 flex items-start gap-2 font-medium">
          <input
            type="checkbox"
            checked={f.policy_accepted}
            onChange={(e) => set("policy_accepted", e.target.checked)}
            required
          />
          <span>
            I have read and accepted the Vendor Registration Policy, TDS policy, Do&apos;s &amp; Don&apos;ts, FAQ, and
            approval conditions. *
          </span>
        </label>
      </div>

      <SectionTitle n={9} title="Declaration" />
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

      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-zinc-200 bg-white/90 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <button
          type="submit"
          disabled={busy || !invitationToken.trim()}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit registration"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          onClick={() => {
            setF(initial);
            setMsg(null);
            setIfscLookup(null);
            setFormUnlocked(false);
            setItsNumber("");
            setItsError(null);
          }}
        >
          Reset form
        </button>
      </div>
    </form>
  );
}
