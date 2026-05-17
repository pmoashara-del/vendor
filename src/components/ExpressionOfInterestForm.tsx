"use client";

import { useState } from "react";
import {
  EOI_CAN_WORK_IN_LOCATION,
  EOI_CAN_WORK_IN_LOCATION_LABELS,
  EOI_ENTITY_TYPES,
  EOI_EXPERIENCE,
  EOI_GST_STATUS,
  EOI_MSME,
  EOI_SOURCE,
  EOI_TURNOVER,
  programmeZonesFromWorkLocation,
} from "@/lib/eoi/options";
import type { EoiCanWorkInLocation } from "@/lib/eoi/options";
import { GST_STATE_OPTIONS, resolveGstStateCode } from "@/lib/eoi/indian-gst-state";
import {
  buildGstinPrefix,
  DEFAULT_GST_STATE_CODE,
  gstinBelongsToPAN,
  validateGSTIN,
  validatePAN,
} from "@/lib/india-tax-ids";
import { CategorySelectionsPicker } from "@/components/CategorySelectionsPicker";
import { panEntityConsistencyMessage, panFourthCharMatchesEntityType } from "@/lib/eoi/pan-entity-consistency";
import {
  isValidCategorySelectionsList,
  legacyCategoryPairsSummary,
  type CategorySelection,
} from "@/lib/eoi/eoi-main-sub-categories";

type Step = 1 | 2 | 3;

const ITS_DIGITS = 8;

function gstStatusesNeedingGstin(s: string): boolean {
  return s === "Registered" || s === "Composition";
}

/** Suggested GSTIN: state (2) + PAN (10) only; user enters the last three characters. Preserves a full valid foreign GSTIN if it does not embed this PAN. */
function nextGstForPan(panField: string, city: string, state: string, prevGst: string): string {
  const panNorm = panField.toUpperCase().replace(/\s/g, "");
  if (!validatePAN(panNorm)) return prevGst;
  const code = resolveGstStateCode(state, city) ?? DEFAULT_GST_STATE_CODE;
  const prefix = buildGstinPrefix(panNorm, code);
  const g = prevGst.trim().toUpperCase().replace(/\s/g, "");
  if (validateGSTIN(g) && !gstinBelongsToPAN(g, panNorm)) return g;
  const suffix = g.startsWith(prefix) && g.length > 12 ? g.slice(12, 15) : "";
  return (prefix + suffix).slice(0, 15);
}

function fieldClass(err: boolean) {
  return `w-full rounded-sm border bg-white px-3.5 py-2.5 text-sm text-[#1a1410] outline-none transition focus:border-[#d4a843] focus:ring-[3px] focus:ring-[rgba(184,134,11,0.1)] ${
    err ? "border-red-600" : "border-[#e8ddd0]"
  }`;
}

export function ExpressionOfInterestForm() {
  const [step, setStep] = useState<Step>(1);
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const [bizName, setBizName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [estYr, setEstYr] = useState("");
  const [businessCity, setBusinessCity] = useState("Indore");
  const [businessState, setBusinessState] = useState("Madhya Pradesh");
  const [address, setAddress] = useState("");
  const [cpName, setCpName] = useState("");
  const [cpRole, setCpRole] = useState("");
  const [itsNumber, setItsNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const [categorySelections, setCategorySelections] = useState<CategorySelection[]>([]);
  const [canWorkLocation, setCanWorkLocation] = useState<EoiCanWorkInLocation | "">("");
  const [expYrs, setExpYrs] = useState("");
  const [turnover, setTurnover] = useState("");
  const [capability, setCapability] = useState("");
  const [prevWork, setPrevWork] = useState("");

  const [pan, setPan] = useState("");
  const [gstNum, setGstNum] = useState("");
  const [gstStatus, setGstStatus] = useState("");
  const [msme, setMsme] = useState("");
  const [source, setSource] = useState("");

  const [declare, setDeclare] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [errs, setErrs] = useState<Partial<Record<string, boolean>>>({});
  /** Step 1 field-level errors only after the user clicks Next (or submit from step 3). */
  const [step1SubmitAttempted, setStep1SubmitAttempted] = useState(false);

  const s1Err = step1SubmitAttempted;

  function syncGstIfNeeded(panVal: string) {
    if (!gstStatusesNeedingGstin(gstStatus)) return;
    setGstNum((prev) => nextGstForPan(panVal, businessCity, businessState, prev));
  }

  function validate(s: Step): boolean {
    const e: Partial<Record<string, boolean>> = {};
    if (s === 1) {
      if (!bizName.trim()) e.bizName = true;
      if (!entityType) e.entityType = true;
      const y = parseInt(estYr, 10);
      if (!y || y < 1950 || y > 2030) e.estYr = true;
      if (!cpName.trim()) e.cpName = true;
      const mob = mobile.replace(/\D/g, "");
      if (mob.length !== 10) e.mobile = true;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = true;
      if (!businessCity.trim()) e.city = true;
      if (!businessState.trim()) e.state = true;
      if (!address.trim()) e.address = true;
      const itsDigits = itsNumber.replace(/\D/g, "");
      if (itsDigits.length > 0 && itsDigits.length !== ITS_DIGITS) e.itsNumber = true;
      const panNorm = pan.toUpperCase().replace(/\s/g, "");
      if (!validatePAN(panNorm)) e.pan = true;
      else if (entityType && !panFourthCharMatchesEntityType(panNorm, entityType)) e.panEntity = true;
      if (!gstStatus) e.gstStatus = true;
      if (gstStatusesNeedingGstin(gstStatus) && !validateGSTIN(gstNum)) e.gstNum = true;
    }
    if (s === 2) {
      if (!isValidCategorySelectionsList(categorySelections)) e.categorySelections = true;
      if (!canWorkLocation) e.canWorkLocation = true;
      if (!expYrs) e.expYrs = true;
      if (!capability.trim()) e.capability = true;
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 1) {
      const ok = validate(1);
      if (!ok) {
        setStep1SubmitAttempted(true);
        return;
      }
      setStep1SubmitAttempted(false);
      setStep(2);
      setFormErr(null);
      return;
    }
    if (!validate(step)) return;
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
    setFormErr(null);
  }
  function back() {
    setFormErr(null);
    setStep((s) => {
      if (s === 2) setStep1SubmitAttempted(false);
      return s > 1 ? ((s - 1) as Step) : s;
    });
  }

  async function submit() {
    if (!validate(1)) {
      setStep(1);
      setStep1SubmitAttempted(true);
      return;
    }
    if (!validate(2)) {
      setStep(2);
      return;
    }
    if (!declare) {
      setFormErr("Please accept the declaration.");
      return;
    }
    setBusy(true);
    setFormErr(null);
    const departments_served: string[] = [];
    const zonesArr = canWorkLocation ? programmeZonesFromWorkLocation(canWorkLocation) : [];
    const itsDigits = itsNumber.replace(/\D/g, "");
    const body = {
      business_name: bizName.trim(),
      entity_type: entityType,
      year_established: parseInt(estYr, 10),
      business_city: businessCity.trim(),
      business_state: businessState.trim(),
      business_address: address.trim(),
      contact_person_name: cpName.trim(),
      contact_role: cpRole.trim() || null,
      its_number: itsDigits.length === ITS_DIGITS ? itsDigits : null,
      mobile: mobile.replace(/\D/g, ""),
      email: email.trim(),
      category_selections: categorySelections,
      departments_served,
      zones: zonesArr,
      can_work_in_programme_location: canWorkLocation as EoiCanWorkInLocation,
      experience_years: expYrs,
      turnover_range: turnover || null,
      capability_description: capability.trim(),
      previous_work: prevWork.trim() || null,
      pan_number: pan.toUpperCase().replace(/\s/g, ""),
      gst_number:
        gstStatusesNeedingGstin(gstStatus) && gstNum.trim()
          ? gstNum.toUpperCase().replace(/\s/g, "")
          : null,
      gst_status: gstStatus,
      msme_status: msme || null,
      certifications: null,
      source: source || null,
      declaration_accepted: true,
    };

    try {
      const res = await fetch("/api/eoi/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; reference_number?: string; error?: string; details?: unknown };
      if (!res.ok) {
        const d =
          typeof data.details === "object" && data.details !== null
            ? JSON.stringify(data.details)
            : data.error ?? "Submission failed";
        setFormErr(d);
        return;
      }
      setRef(data.reference_number ?? "");
      setDone(true);
    } catch {
      setFormErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function copyReferenceNumber() {
    if (!ref) return;
    try {
      await navigator.clipboard.writeText(ref);
      setCopyFeedback("Copied to clipboard.");
      window.setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback("Copy was blocked — select the reference text above to copy it manually.");
      window.setTimeout(() => setCopyFeedback(null), 4000);
    }
  }

  function downloadReferenceFile() {
    if (!ref) return;
    const text = [
      "Expression of Interest — reference number",
      "",
      ref,
      "",
      `Saved: ${new Date().toLocaleString()}`,
      "",
      "Keep this reference for correspondence with the organisers.",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EOI-reference-${ref.replace(/[^A-Za-z0-9-]+/g, "_")}.txt`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-sm border border-[#e8ddd0] bg-[#fff9f0] px-8 py-16 text-center shadow-lg">
        <div className="mb-4 text-5xl">✅</div>
        <h2 className="font-[family-name:var(--font-cormorant)] text-3xl font-bold text-[#2d5a27]">EOI Submitted</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#4a3f35]">
          Thank you. Your Expression of Interest is recorded. Shortlisted vendors will be contacted for verification
          and next steps.
        </p>
        {ref ? (
          <div className="mt-6 space-y-4">
            <div className="inline-block max-w-full rounded-sm border border-[#9dcc99] bg-[#eaf4e9] px-5 py-3 font-[family-name:var(--font-cormorant)] text-lg font-semibold tracking-wide text-[#2d5a27]">
              <span className="select-all break-all">{ref}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => void copyReferenceNumber()}
                className="rounded-sm border border-[#2d5a27] bg-white px-4 py-2 text-[13px] font-semibold text-[#2d5a27] shadow-sm transition hover:bg-[#eaf4e9]"
              >
                Copy reference
              </button>
              <button
                type="button"
                onClick={downloadReferenceFile}
                className="rounded-sm bg-[#2d5a27] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#234620]"
              >
                Download as .txt
              </button>
            </div>
            {copyFeedback ? <p className="text-center text-xs text-[#4a3f35]">{copyFeedback}</p> : null}
          </div>
        ) : null}
        <p className="mt-6 text-xs text-[#8a7a6e]">Save your reference number for future correspondence.</p>
      </div>
    );
  }

  return (
    <div className="font-[family-name:var(--font-jost)] text-[#1a1410]">
      {/* Progress */}
      <div className="mx-auto mb-8 max-w-2xl px-4">
        <div className="mb-2 flex justify-between text-[10px] uppercase tracking-wider text-[#8a7a6e]">
          <span>Step {step} of 3</span>
          <span>
            {step === 1 ? "Business & tax" : step === 2 ? "What you can supply" : "Declaration"}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[#e8ddd0]">
          <div
            className="h-full rounded-full bg-[#b8860b] transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-2xl overflow-hidden rounded-sm border border-[#e8ddd0] bg-[#fff9f0] shadow-[0_4px_32px_rgba(26,20,16,0.1)]">
        {formErr ? (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-800">{formErr}</div>
        ) : null}

        {step === 1 && (
          <Panel
            icon="🏢"
            title="Business Information"
            desc="Your firm, contact details, and basic tax information"
            body={
              <div className="contents" onFocusCapture={() => setStep1SubmitAttempted(false)}>
                <Notice text="This is an Expression of Interest only. Submission does not guarantee empanelment. Shortlisted vendors will be contacted for document verification and final registration." />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label req>Business / Firm Name</Label>
                    <input
                      className={fieldClass(s1Err && !!errs.bizName)}
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      placeholder="As registered / operating name"
                    />
                  </div>
                  <div>
                    <Label req>Type of Entity</Label>
                    <select
                      className={fieldClass(s1Err && (!!errs.entityType || !!errs.panEntity))}
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value)}
                    >
                      <option value="">— Select —</option>
                      {EOI_ENTITY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label req>Year Established</Label>
                    <input
                      type="number"
                      min={1950}
                      max={2030}
                      className={fieldClass(s1Err && !!errs.estYr)}
                      value={estYr}
                      onChange={(e) => setEstYr(e.target.value)}
                      placeholder="e.g. 2010"
                    />
                  </div>
                </div>
                <Divider label="Primary Contact" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label req>Contact Person Name</Label>
                    <input
                      className={fieldClass(s1Err && !!errs.cpName)}
                      value={cpName}
                      onChange={(e) => setCpName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Designation / Role</Label>
                    <input className={fieldClass(false)} value={cpRole} onChange={(e) => setCpRole(e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>ITS number</Label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={ITS_DIGITS}
                      className={fieldClass(s1Err && !!errs.itsNumber)}
                      value={itsNumber}
                      onChange={(e) => setItsNumber(e.target.value.replace(/\D/g, "").slice(0, ITS_DIGITS))}
                    />
                  </div>
                  <div>
                    <Label req>Mobile Number</Label>
                    <input
                      className={fieldClass(s1Err && !!errs.mobile)}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <div>
                    <Label req>Email Address</Label>
                    <input
                      type="email"
                      className={fieldClass(s1Err && !!errs.email)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Divider label="Business location" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label req>City</Label>
                    <input
                      className={fieldClass(s1Err && !!errs.city)}
                      value={businessCity}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBusinessCity(v);
                        syncGstIfNeeded(pan);
                      }}
                    />
                  </div>
                  <div>
                    <Label req>State / UT</Label>
                    <select
                      className={fieldClass(s1Err && !!errs.state)}
                      value={businessState}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBusinessState(v);
                        syncGstIfNeeded(pan);
                      }}
                    >
                      <option value="">— Select —</option>
                      {GST_STATE_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label req>Street, building, locality</Label>
                    <textarea
                      rows={2}
                      className={fieldClass(s1Err && !!errs.address)}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Building, street, area, PIN"
                    />
                  </div>
                </div>
                <Divider label="PAN, GST & MSME" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label req>PAN Number</Label>
                    <input
                      className={fieldClass(s1Err && (!!errs.pan || !!errs.panEntity))}
                      value={pan}
                      maxLength={10}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 10);
                        setPan(v);
                        syncGstIfNeeded(v);
                      }}
                      placeholder="ABCDE1234F"
                    />
                    <p className="mt-1 text-[11px] text-[#8a7a6e]">10-character Permanent Account Number</p>
                    {s1Err && errs.panEntity ? (
                      <p className="mt-1 text-xs leading-snug text-red-600">
                        {panEntityConsistencyMessage(entityType, pan)}
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <Label req>GST Status</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {EOI_GST_STATUS.map((g) => (
                        <label key={g} className="cursor-pointer">
                          <input
                            type="radio"
                            name="gst"
                            className="peer sr-only"
                            checked={gstStatus === g}
                            onChange={() => {
                              setGstStatus(g);
                              if (gstStatusesNeedingGstin(g)) {
                                setGstNum((prev) => nextGstForPan(pan, businessCity, businessState, prev));
                              } else {
                                setGstNum("");
                              }
                            }}
                          />
                          <span className="block rounded-sm border border-[#e8ddd0] px-4 py-2 text-[13px] text-[#4a3f35] peer-checked:border-[#b8860b] peer-checked:bg-[#fff8ec] peer-checked:font-semibold peer-checked:text-[#b8860b]">
                            {g === "Registered"
                              ? "GST Registered"
                              : g === "Composition"
                                ? "Composition Scheme"
                                : g === "Unregistered"
                                  ? "Not Registered"
                                  : "Exempt Supply"}
                          </span>
                        </label>
                      ))}
                    </div>
                    {s1Err && errs.gstStatus ? <p className="mt-1 text-xs text-red-600">Select GST status</p> : null}
                  </div>
                  {gstStatusesNeedingGstin(gstStatus) ? (
                    <div className="sm:col-span-2">
                      <Label req>GSTIN (15 characters)</Label>
                      <input
                        className={fieldClass(s1Err && !!errs.gstNum)}
                        value={gstNum}
                        maxLength={15}
                        onChange={(e) =>
                          setGstNum(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 15))
                        }
                      />
                      {s1Err && errs.gstNum ? (
                        <p className="mt-1 text-xs text-red-600">
                          {gstNum.replace(/\s/g, "").length < 15
                            ? "Enter the last three characters of your GSTIN; they are not auto-filled and are required."
                            : "Enter a valid 15-character GSTIN"}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-[#8a7a6e]">
                          The first 12 characters follow your state and PAN. Enter the final three characters yourself
                          (they are not filled in for you).
                        </p>
                      )}
                    </div>
                  ) : null}
                  <div className="sm:col-span-2">
                    <Label>MSME / Udyam Status</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {EOI_MSME.map((m) => (
                        <label key={m} className="cursor-pointer">
                          <input
                            type="radio"
                            name="msme"
                            className="peer sr-only"
                            checked={msme === m}
                            onChange={() => setMsme(m)}
                          />
                          <span className="block rounded-sm border border-[#e8ddd0] px-4 py-2 text-[13px] peer-checked:border-[#b8860b] peer-checked:bg-[#fff8ec] peer-checked:font-semibold">
                            {m}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            }
            foot={
              <>
                <div />
                <button
                  type="button"
                  onClick={next}
                  className="rounded-sm bg-[#b8860b] px-7 py-2.5 text-[13px] font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-[#a07808]"
                >
                  Next — What you can supply →
                </button>
              </>
            }
          />
        )}

        {step === 2 && (
          <Panel
            icon="📦"
            title="What you can supply"
            desc="Pick industries from the list and the vendor types you offer, then describe your items and services in detail."
            body={
              <>
                <Notice text="You must give a clear list of what you can supply (goods and/or services). Use separate lines or bullet points so evaluators can see each item — not only a general company description." />
                <div className="sm:col-span-2">
                  <Label req>Categories you supply</Label>
                  <p className="mb-2 text-[12px] leading-snug text-[#8a7a6e]">
                    Choose an industry from the dropdown, tick every vendor type you offer under it, then pick another
                    industry if needed.
                  </p>
                  <CategorySelectionsPicker
                    value={categorySelections}
                    onChange={setCategorySelections}
                    variant="eoi"
                    error={!!errs.categorySelections}
                  />
                  {errs.categorySelections ? (
                    <p className="mt-2 text-xs text-red-600">
                      Select at least one valid combination — each ticked type must belong to the industry section it
                      appears under.
                    </p>
                  ) : null}
                </div>
                <Divider label="Programme location" />
                <div className="sm:col-span-2">
                  <p className="mb-3 text-[12px] leading-snug text-[#8a7a6e]">
                    Programme work is evaluated for Indore and Madhya Pradesh. This is about where you can take
                    assignments for this programme, not only where your business is registered.
                  </p>
                  <Label req>Can you take on work based in Indore / Madhya Pradesh for this programme?</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EOI_CAN_WORK_IN_LOCATION.map((v) => (
                      <label key={v} className="cursor-pointer">
                        <input
                          type="radio"
                          name="canWorkLocation"
                          className="peer sr-only"
                          checked={canWorkLocation === v}
                          onChange={() => setCanWorkLocation(v)}
                        />
                        <span className="block max-w-xl rounded-sm border border-[#e8ddd0] px-4 py-2 text-left text-[13px] text-[#4a3f35] peer-checked:border-[#b8860b] peer-checked:bg-[#fff8ec] peer-checked:font-semibold peer-checked:text-[#b8860b]">
                          {EOI_CAN_WORK_IN_LOCATION_LABELS[v]}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errs.canWorkLocation ? (
                    <p className="mt-1 text-xs text-red-600">Select one option</p>
                  ) : null}
                </div>
                <Divider label="Experience & Scale" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label req>Years of Experience in This Field</Label>
                    <select
                      className={fieldClass(!!errs.expYrs)}
                      value={expYrs}
                      onChange={(e) => setExpYrs(e.target.value)}
                    >
                      <option value="">— Select —</option>
                      {EOI_EXPERIENCE.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Annual Turnover Range</Label>
                    <select className={fieldClass(false)} value={turnover} onChange={(e) => setTurnover(e.target.value)}>
                      <option value="">— Optional —</option>
                      {EOI_TURNOVER.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label req>List of items &amp; services you can provide</Label>
                    <p className="mb-1.5 text-[12px] leading-snug text-[#8a7a6e]">
                      Write each product, material, equipment type, or service on its own line (or use bullets). Be
                      specific — for example quantities, sizes, capacities, or pack types where relevant. This field is
                      required and is used to match you to programme needs.
                    </p>
                    <textarea
                      rows={6}
                      maxLength={500}
                      className={fieldClass(!!errs.capability)}
                      value={capability}
                      onChange={(e) => setCapability(e.target.value)}
                      placeholder={
                        "Examples:\n• Parboiled rice — 50 kg bags, supply up to 10 tonnes/month\n• Diesel generators — 25 kVA and 63 kVA with cabling\n• Tent / shamiana — 300–800 guests\n• Housekeeping — daily staff for office blocks"
                      }
                    />
                    <p className="mt-1 text-right text-[11px] text-[#8a7a6e]">{capability.length}/500</p>
                    {errs.capability ? (
                      <p className="mt-1 text-xs text-red-600">
                        Enter a list of the items and/or services you can provide (not only your company name).
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Previous Work with Similar Organisations (Optional)</Label>
                    <textarea
                      rows={3}
                      maxLength={400}
                      className={fieldClass(false)}
                      value={prevWork}
                      onChange={(e) => setPrevWork(e.target.value)}
                    />
                    <p className="text-right text-[11px] text-[#8a7a6e]">{prevWork.length}/400</p>
                  </div>
                </div>
                <Divider label="How you heard about this EOI" />
                <div>
                  <Label>How did you hear about this EOI?</Label>
                  <select className={fieldClass(false)} value={source} onChange={(e) => setSource(e.target.value)}>
                    <option value="">— Optional —</option>
                    {EOI_SOURCE.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            }
            foot={
              <>
                <button
                  type="button"
                  onClick={back}
                  className="rounded-sm border border-[#e8ddd0] bg-transparent px-6 py-2.5 text-[13px] font-semibold uppercase tracking-wider text-[#4a3f35] hover:border-[#8a7a6e]"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-sm bg-[#b8860b] px-7 py-2.5 text-[13px] font-semibold uppercase tracking-wider text-white shadow-md hover:bg-[#a07808]"
                >
                  Next — Declaration →
                </button>
              </>
            }
          />
        )}

        {step === 3 && (
          <Panel
            icon="📝"
            title="Declaration & Submission"
            desc="Please review and confirm before submitting"
            body={
              <>
                <div className="mb-6 rounded-sm border border-[#e8ddd0] bg-[#f5f0e8] p-5 text-[13px] text-[#4a3f35]">
                  <p className="font-[family-name:var(--font-cormorant)] text-base font-bold text-[#1a1410]">
                    Summary
                  </p>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    <dt className="text-[#8a7a6e]">Business</dt>
                    <dd className="font-medium">{bizName}</dd>
                    <dt className="text-[#8a7a6e]">Categories</dt>
                    <dd className="font-medium leading-snug">
                      {legacyCategoryPairsSummary(categorySelections) || "—"}
                    </dd>
                    <dt className="text-[#8a7a6e]">Items &amp; services you will supply</dt>
                    <dd className="whitespace-pre-wrap text-[13px] font-medium leading-snug">{capability || "—"}</dd>
                    <dt className="text-[#8a7a6e]">Contact</dt>
                    <dd className="font-medium">
                      {cpName} · {email}
                    </dd>
                    <dt className="text-[#8a7a6e]">Location</dt>
                    <dd className="font-medium">
                      {businessCity}
                      {businessState ? `, ${businessState}` : ""}
                    </dd>
                    <dt className="text-[#8a7a6e]">PAN</dt>
                    <dd className="font-mono text-[13px] font-medium">{pan.toUpperCase().replace(/\s/g, "")}</dd>
                    <dt className="text-[#8a7a6e]">GST status</dt>
                    <dd className="font-medium">{gstStatus || "—"}</dd>
                    {gstStatusesNeedingGstin(gstStatus) && gstNum.replace(/\s/g, "").length > 0 ? (
                      <>
                        <dt className="text-[#8a7a6e]">GSTIN</dt>
                        <dd className="break-all font-mono text-[13px] font-medium">
                          {gstNum.toUpperCase().replace(/\s/g, "")}
                        </dd>
                      </>
                    ) : null}
                    <dt className="text-[#8a7a6e]">Work in programme area</dt>
                    <dd className="font-medium">
                      {canWorkLocation ? EOI_CAN_WORK_IN_LOCATION_LABELS[canWorkLocation] : "—"}
                    </dd>
                    {itsNumber.replace(/\D/g, "").length === ITS_DIGITS ? (
                      <>
                        <dt className="text-[#8a7a6e]">ITS number</dt>
                        <dd className="font-mono text-[13px] font-medium tabular-nums">
                          {itsNumber.replace(/\D/g, "")}
                        </dd>
                      </>
                    ) : null}
                  </dl>
                </div>
                <div className="mb-5 rounded-sm border border-[#e8ddd0] bg-[#f5f0e8] p-5 text-[13px] leading-relaxed text-[#4a3f35]">
                  <p>I / We hereby declare that the information provided is true and complete. Submission does not
                  guarantee empanelment. I / We consent to verification including PAN and GST with authorities.</p>
                </div>
                <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-[#1a1410]">
                  <input
                    type="checkbox"
                    checked={declare}
                    onChange={(e) => setDeclare(e.target.checked)}
                    className="mt-1 accent-[#7c3a1e]"
                  />
                  <span>I confirm that I have read and agree to the declaration above.</span>
                </label>
              </>
            }
            foot={
              <>
                <button
                  type="button"
                  onClick={back}
                  className="rounded-sm border border-[#e8ddd0] px-6 py-2.5 text-[13px] font-semibold uppercase text-[#4a3f35]"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit()}
                  className="rounded-sm bg-[#7c3a1e] px-7 py-2.5 text-[13px] font-semibold uppercase text-white shadow-md hover:bg-[#6a3018] disabled:opacity-50"
                >
                  {busy ? "Submitting…" : "✦ Submit Expression of Interest"}
                </button>
              </>
            }
          />
        )}
      </div>
    </div>
  );
}

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4a3f35]">
      {children}
      {req ? <span className="ml-0.5 text-[#7c3a1e]">*</span> : null}
    </label>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div className="mb-6 rounded-sm border border-[#e8d5a0] border-l-[3px] border-l-[#b8860b] bg-gradient-to-br from-[#fff8ec] to-[#fffdf8] p-4 text-[13px] leading-relaxed text-[#4a3f35]">
      <strong className="text-[#1a1410]">Note:</strong> {text}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-7 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#e8ddd0]" />
      <span className="whitespace-nowrap text-[10px] uppercase tracking-widest text-[#8a7a6e]">{label}</span>
      <div className="h-px flex-1 bg-[#e8ddd0]" />
    </div>
  );
}

function Panel({
  icon,
  title,
  desc,
  body,
  foot,
}: {
  icon: string;
  title: string;
  desc: string;
  body: React.ReactNode;
  foot: React.ReactNode;
}) {
  return (
    <>
      <div className="flex gap-4 border-b border-[#e8ddd0] bg-gradient-to-br from-[#fffdf8] to-[#fff6e8] px-6 py-7 sm:px-9">
        <span className="text-2xl">{icon}</span>
        <div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-[22px] font-bold text-[#1a1410]">{title}</h2>
          <p className="mt-1 text-[13px] text-[#8a7a6e]">{desc}</p>
        </div>
      </div>
      <div className="px-6 py-8 sm:px-9">{body}</div>
      <div className="flex items-center justify-between border-t border-[#e8ddd0] bg-[#fffdf8] px-6 py-5 sm:px-9">
        {foot}
      </div>
    </>
  );
}
