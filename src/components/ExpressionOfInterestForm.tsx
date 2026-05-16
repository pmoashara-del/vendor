"use client";

import { useRef, useState } from "react";
import {
  buildGSTIN,
  gstinBelongsToPAN,
  validatePAN,
} from "@/lib/india-pan-gstin";
import {
  EOI_CATEGORY_GROUPS,
  EOI_DEPARTMENT_LABELS,
  EOI_DEPARTMENTS,
  EOI_ENTITY_TYPES,
  EOI_EXPERIENCE,
  EOI_GST_STATUS,
  EOI_MSME,
  EOI_SOURCE,
  EOI_TURNOVER,
  EOI_ZONES,
} from "@/lib/eoi/options";

type Step = 1 | 2 | 3 | 4;

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
  const [address, setAddress] = useState("");
  const [cpName, setCpName] = useState("");
  const [cpRole, setCpRole] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const [category, setCategory] = useState("");
  const [depts, setDepts] = useState<Record<string, boolean>>({});
  const [zones, setZones] = useState<Record<string, boolean>>({});
  const [expYrs, setExpYrs] = useState("");
  const [turnover, setTurnover] = useState("");
  const [capability, setCapability] = useState("");
  const [prevWork, setPrevWork] = useState("");

  const [pan, setPan] = useState("");
  const [gstNum, setGstNum] = useState("");
  const gstNumUserEdited = useRef(false);
  const [itsNumber, setItsNumber] = useState("");
  const [gstStatus, setGstStatus] = useState("");
  const [msme, setMsme] = useState("");
  const [certs, setCerts] = useState("");
  const [source, setSource] = useState("");

  const [declare, setDeclare] = useState(false);

  const [errs, setErrs] = useState<Partial<Record<string, boolean>>>({});

  const DEFAULT_EOI_GST_STATE = 23;

  function toggleDept(k: string) {
    setDepts((d) => ({ ...d, [k]: !d[k] }));
  }
  function toggleZone(k: string) {
    setZones((z) => ({ ...z, [k]: !z[k] }));
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
      if (!address.trim()) e.address = true;
    }
    if (s === 2) {
      if (!category) e.category = true;
      if (!EOI_ZONES.some((z) => zones[z])) e.zones = true;
      if (!expYrs) e.expYrs = true;
      if (!capability.trim()) e.capability = true;
    }
    if (s === 3) {
      if (!validatePAN(pan.toUpperCase().replace(/\s/g, ""))) e.pan = true;
      const itsDigits = itsNumber.replace(/\D/g, "");
      if (itsDigits.length > 0 && itsDigits.length !== 8) e.its = true;
      if (!gstStatus) e.gstStatus = true;
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validate(step)) return;
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
    setFormErr(null);
  }
  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
    setFormErr(null);
  }

  async function submit() {
    if (!validate(3)) {
      setStep(3);
      return;
    }
    if (!declare) {
      setFormErr("Please accept the declaration.");
      return;
    }
    setBusy(true);
    setFormErr(null);
    const departments_served = EOI_DEPARTMENTS.filter((d) => depts[d]).map(String);
    const zonesArr = EOI_ZONES.filter((z) => zones[z]).map(String);
    const body = {
      business_name: bizName.trim(),
      entity_type: entityType,
      year_established: parseInt(estYr, 10),
      business_address: address.trim(),
      contact_person_name: cpName.trim(),
      contact_role: cpRole.trim() || null,
      mobile: mobile.replace(/\D/g, ""),
      email: email.trim(),
      primary_category: category,
      departments_served,
      zones: zonesArr,
      experience_years: expYrs,
      turnover_range: turnover || null,
      capability_description: capability.trim(),
      previous_work: prevWork.trim() || null,
      its_number: (() => {
        const d = itsNumber.replace(/\D/g, "");
        return d.length === 8 ? d : null;
      })(),
      pan_number: pan.toUpperCase().replace(/\s/g, ""),
      gst_number: gstNum.trim() ? gstNum.toUpperCase().replace(/\s/g, "") : null,
      gst_status: gstStatus,
      msme_status: msme || null,
      certifications: certs.trim() || null,
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
          <div className="mt-6 inline-block rounded-sm border border-[#9dcc99] bg-[#eaf4e9] px-5 py-2 font-[family-name:var(--font-cormorant)] text-lg font-semibold text-[#2d5a27]">
            {ref}
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
          <span>Step {step} of 4</span>
          <span>
            {step === 1 ? "Business" : step === 2 ? "Offerings" : step === 3 ? "Compliance" : "Declaration"}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[#e8ddd0]">
          <div
            className="h-full rounded-full bg-[#b8860b] transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
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
            desc="Basic details about your firm, proprietorship, or company"
            body={
              <>
                <Notice text="This is an Expression of Interest only. Submission does not guarantee empanelment. Shortlisted vendors will be contacted for document verification and final registration." />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label req>Business / Firm Name</Label>
                    <input
                      className={fieldClass(!!errs.bizName)}
                      value={bizName}
                      onChange={(e) => setBizName(e.target.value)}
                      placeholder="As registered / operating name"
                    />
                  </div>
                  <div>
                    <Label req>Type of Entity</Label>
                    <select
                      className={fieldClass(!!errs.entityType)}
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
                      className={fieldClass(!!errs.estYr)}
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
                      className={fieldClass(!!errs.cpName)}
                      value={cpName}
                      onChange={(e) => setCpName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Designation / Role</Label>
                    <input className={fieldClass(false)} value={cpRole} onChange={(e) => setCpRole(e.target.value)} />
                  </div>
                  <div>
                    <Label req>Mobile Number</Label>
                    <input
                      className={fieldClass(!!errs.mobile)}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <div>
                    <Label req>Email Address</Label>
                    <input
                      type="email"
                      className={fieldClass(!!errs.email)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label req>Business Address</Label>
                    <textarea
                      rows={2}
                      className={fieldClass(!!errs.address)}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Full address with city, state and PIN code"
                    />
                  </div>
                </div>
              </>
            }
            foot={
              <>
                <div />
                <button
                  type="button"
                  onClick={next}
                  className="rounded-sm bg-[#b8860b] px-7 py-2.5 text-[13px] font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-[#a07808]"
                >
                  Next — Offerings →
                </button>
              </>
            }
          />
        )}

        {step === 2 && (
          <Panel
            icon="📦"
            title="Offerings & Capability"
            desc="Describe the goods or services you wish to supply"
            body={
              <>
                <div>
                  <Label req>Primary Category of Supply</Label>
                  <select
                    className={fieldClass(!!errs.category)}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">— Select a category —</option>
                    {EOI_CATEGORY_GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="mt-5">
                  <Label>Departments / Areas You Can Serve</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EOI_DEPARTMENTS.map((d) => (
                      <label key={d} className="flex cursor-pointer items-center gap-2 text-[13px] text-[#4a3f35]">
                        <input
                          type="checkbox"
                          checked={!!depts[d]}
                          onChange={() => toggleDept(d)}
                          className="accent-[#b8860b]"
                        />
                        {EOI_DEPARTMENT_LABELS[d] ?? d}
                      </label>
                    ))}
                  </div>
                </div>
                <Divider label="Geographic Coverage" />
                <div>
                  <Label req>Zones / Cities You Can Operate In</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EOI_ZONES.map((z) => (
                      <label key={z} className="flex cursor-pointer items-center gap-2 text-[13px] text-[#4a3f35]">
                        <input
                          type="checkbox"
                          checked={!!zones[z]}
                          onChange={() => toggleZone(z)}
                          className="accent-[#b8860b]"
                        />
                        {z}
                      </label>
                    ))}
                  </div>
                  {errs.zones ? <p className="mt-1 text-xs text-red-600">Select at least one zone</p> : null}
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
                    <Label req>Brief Description of Capability</Label>
                    <textarea
                      rows={4}
                      maxLength={500}
                      className={fieldClass(!!errs.capability)}
                      value={capability}
                      onChange={(e) => setCapability(e.target.value)}
                    />
                    <p className="text-right text-[11px] text-[#8a7a6e]">{capability.length}/500</p>
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
                  Next — Compliance →
                </button>
              </>
            }
          />
        )}

        {step === 3 && (
          <Panel
            icon="📋"
            title="Statutory & Compliance Details"
            desc="Basic tax and registration details for verification purposes"
            body={
              <>
                <Notice text="This information is used for preliminary verification only. Full documentation (PAN card, GST certificate, etc.) will be requested at the time of formal empanelment." />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>ITS number (optional)</Label>
                    <input
                      className={fieldClass(!!errs.its)}
                      value={itsNumber}
                      inputMode="numeric"
                      maxLength={8}
                      autoComplete="off"
                      onChange={(e) => setItsNumber(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      placeholder="8 digits if applicable"
                    />
                    <p className="mt-1 text-[11px] text-[#8a7a6e]">
                      For community members only. Leave blank if not applicable. If you enter a value, it must be
                      exactly 8 digits.
                    </p>
                    {errs.its ? <p className="mt-1 text-xs text-red-600">ITS must be exactly 8 digits or left blank</p> : null}
                  </div>
                  <div>
                    <Label req>PAN Number</Label>
                    <input
                      className={fieldClass(!!errs.pan)}
                      value={pan}
                      maxLength={10}
                      onChange={(e) => {
                        const nextPan = e.target.value.toUpperCase();
                        setPan(nextPan);
                        if (gstNumUserEdited.current) return;
                        const p = nextPan.replace(/\s/g, "");
                        if (!validatePAN(p)) return;
                        setGstNum((g) => {
                          const cur = g.toUpperCase().replace(/\s/g, "");
                          if (cur.length === 15 && !gstinBelongsToPAN(cur, p)) return cur;
                          let entity = 1;
                          if (cur.length === 15 && gstinBelongsToPAN(cur, p)) {
                            const d = parseInt(cur[12], 10);
                            if (d >= 1 && d <= 9) entity = d;
                          }
                          const next = buildGSTIN(p, DEFAULT_EOI_GST_STATE, entity);
                          return next === cur ? cur : next;
                        });
                      }}
                      placeholder="e.g. AAAPL1234C"
                    />
                    <p className="mt-1 text-[11px] text-[#8a7a6e]">10-character Permanent Account Number</p>
                  </div>
                  <div>
                    <Label>GST Registration Number</Label>
                    <input
                      className={fieldClass(false)}
                      value={gstNum}
                      maxLength={15}
                      onChange={(e) => {
                        gstNumUserEdited.current = true;
                        setGstNum(e.target.value.toUpperCase());
                      }}
                      placeholder="Leave blank if not registered"
                    />
                    <p className="mt-1 text-[11px] text-[#8a7a6e]">
                      When your PAN is complete and valid, a suggested GSTIN is filled using state code {DEFAULT_EOI_GST_STATE}{" "}
                      (Madhya Pradesh). Edit if your registration uses another state.
                    </p>
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
                            onChange={() => setGstStatus(g)}
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
                    {errs.gstStatus ? <p className="mt-1 text-xs text-red-600">Select GST status</p> : null}
                  </div>
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
                <Divider label="Supporting Information" />
                <div>
                  <Label>Certifications, Licences or Approvals</Label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    className={fieldClass(false)}
                    value={certs}
                    onChange={(e) => setCerts(e.target.value)}
                  />
                </div>
                <div className="mt-4">
                  <Label>How Did You Hear About This EOI?</Label>
                  <select className={fieldClass(false)} value={source} onChange={(e) => setSource(e.target.value)}>
                    <option value="">— Optional —</option>
                    {EOI_SOURCE.map((s) => (
                      <option key={s} value={s}>
                        {s}
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
                  className="rounded-sm border border-[#e8ddd0] px-6 py-2.5 text-[13px] font-semibold uppercase text-[#4a3f35]"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-sm bg-[#b8860b] px-7 py-2.5 text-[13px] font-semibold uppercase text-white hover:bg-[#a07808]"
                >
                  Next — Declaration →
                </button>
              </>
            }
          />
        )}

        {step === 4 && (
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
                    <dt className="text-[#8a7a6e]">Category</dt>
                    <dd className="font-medium">{category}</dd>
                    <dt className="text-[#8a7a6e]">Contact</dt>
                    <dd className="font-medium">
                      {cpName} · {email}
                    </dd>
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
