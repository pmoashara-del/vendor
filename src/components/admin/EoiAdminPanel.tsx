"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadEoiAdminDoc,
  exportEoiListToXlsx,
  eoiWorkflowActionsSummary,
} from "@/lib/admin/export-reports";
import {
  eoiCategorySelectionsFromRow,
  eoiCategorySummaryLine,
  selectionsSearchBlob,
} from "@/lib/eoi/eoi-row-display";
import { AdminChecklistFilter, type ChecklistSelection } from "@/components/admin/AdminChecklistFilter";
import type { ExpressionOfInterestRow, EoiStatus } from "@/types/eoi";

const STATUS_OPTIONS: EoiStatus[] = [
  "submitted",
  "shortlisted",
  "meeting_invited",
  "invited_to_register",
  "declined",
  "registered",
];

function formatSelectionsList(selections: ReturnType<typeof eoiCategorySelectionsFromRow>): ReactNode {
  if (!selections.length) return "—";
  return (
    <ul className="list-inside list-disc space-y-1 text-sm">
      {selections.map((sel) => (
        <li key={`${sel.main}\u0000${sel.sub}`}>
          {sel.main ? (
            <>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{sel.main}</span>
              <span className="text-zinc-500"> — </span>
            </>
          ) : null}
          <span>{sel.sub}</span>
        </li>
      ))}
    </ul>
  );
}

function formatDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatJsonList(value: unknown): string {
  if (value == null) return "—";
  if (Array.isArray(value)) {
    const parts = value.map((x) => String(x)).filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  const s = String(value);
  return s || "—";
}

function yesNo(v: boolean | null | undefined): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-5 border-b border-zinc-200 pb-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 first:mt-0 dark:border-zinc-600 dark:text-amber-200">
      {children}
    </h3>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 border-b border-zinc-100 py-2.5 sm:grid-cols-[10.5rem_1fr] sm:gap-3 dark:border-zinc-800">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

const emptyEoiFilters: Record<
  "ref" | "submitted" | "updated" | "business" | "categories" | "email" | "its" | "status" | "details" | "actions",
  ChecklistSelection
> = {
  ref: null,
  submitted: null,
  updated: null,
  business: null,
  categories: null,
  email: null,
  its: null,
  status: null,
  details: null,
  actions: null,
};

type EoiColFilters = typeof emptyEoiFilters;

function eoiDetailsFilterValue(s: ExpressionOfInterestRow): string {
  const status = s.eoi_status.replaceAll("_", " ");
  const meeting = s.meeting_invite_sent_at ? "Meeting invite sent" : "No meeting invite";
  const token = s.registration_token_hash ? "Registration token issued" : "No registration token";
  const used = s.registration_token_used_at ? "Registration link used" : "Registration link not used";
  const vend = s.vendor_registration_id ? "Vendor registration linked" : "No vendor registration link";
  return `${status} · ${meeting} · ${token} · ${used} · ${vend}`;
}

function eoiActionsFilterValue(s: ExpressionOfInterestRow): string {
  const table = s.meeting_invite_sent_at ? "Table session email on file" : "No table session email on file";
  const reg = s.registration_token_used_at ? "Full registration link used" : "Full registration link not used";
  return `${table} · ${reg}`;
}

function eoiGlobalSearchBlob(s: ExpressionOfInterestRow): string {
  const cats = eoiCategorySelectionsFromRow(s);
  const parts = [
    s.reference_number,
    formatDateTime(s.created_at),
    formatDateTime(s.updated_at),
    s.business_name,
    eoiCategorySummaryLine(s),
    selectionsSearchBlob(cats),
    s.email,
    s.its_number ?? "",
    s.eoi_status.replaceAll("_", " "),
    eoiDetailsFilterValue(s),
    eoiActionsFilterValue(s),
    s.id,
    eoiWorkflowActionsSummary(s),
  ];
  return parts.join(" ").toLowerCase();
}

function matchesGlobalSearch(query: string, blob: string): boolean {
  const t = query.trim().toLowerCase();
  if (!t) return true;
  return blob.includes(t);
}

function colMatch(sel: ChecklistSelection, cellValue: string): boolean {
  if (sel == null) return true;
  return sel.has(cellValue);
}

function eoiCellValues(s: ExpressionOfInterestRow) {
  return {
    ref: s.reference_number || "—",
    submitted: formatDateTime(s.created_at),
    updated: formatDateTime(s.updated_at),
    business: s.business_name || "—",
    categories: eoiCategorySummaryLine(s) || "—",
    email: s.email || "—",
    its: s.its_number ?? "—",
    status: s.eoi_status.replaceAll("_", " "),
    details: eoiDetailsFilterValue(s),
    actions: eoiActionsFilterValue(s),
  };
}

function eoiRowMatchesColumnFilters(s: ExpressionOfInterestRow, f: EoiColFilters): boolean {
  const c = eoiCellValues(s);
  if (!colMatch(f.ref, c.ref)) return false;
  if (!colMatch(f.submitted, c.submitted)) return false;
  if (!colMatch(f.updated, c.updated)) return false;
  if (!colMatch(f.business, c.business)) return false;
  if (!colMatch(f.categories, c.categories)) return false;
  if (!colMatch(f.email, c.email)) return false;
  if (!colMatch(f.its, c.its)) return false;
  if (!colMatch(f.status, c.status)) return false;
  if (!colMatch(f.details, c.details)) return false;
  if (!colMatch(f.actions, c.actions)) return false;
  return true;
}

function EoiDetailModal({ row, onClose }: { row: ExpressionOfInterestRow; onClose: () => void }) {
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const statusLabel = row.eoi_status.replaceAll("_", " ");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="eoi-detail-title"
        className="max-h-[min(90vh,48rem)] w-full max-w-3xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 bg-amber-50/80 px-5 py-4 dark:border-zinc-700 dark:bg-amber-950/40">
          <div className="min-w-0">
            <p id="eoi-detail-title" className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {row.reference_number}
            </p>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              Full submission record · Status: <span className="font-medium capitalize">{statusLabel}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadEoiAdminDoc(row)}
              className="rounded-lg border border-amber-600 bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Download .doc
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Close
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 pb-6" style={{ maxHeight: "min(calc(90vh - 5rem), 42rem)" }}>
          <SectionTitle>Workflow summary (for exports)</SectionTitle>
          <p className="mt-2 whitespace-pre-wrap rounded border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            {eoiWorkflowActionsSummary(row)}
          </p>

          <SectionTitle>Record &amp; timestamps</SectionTitle>
          <dl>
            <DetailRow label="Internal ID">{row.id}</DetailRow>
            <DetailRow label="Submitted">{formatDateTime(row.created_at)}</DetailRow>
            <DetailRow label="Last updated">{formatDateTime(row.updated_at)}</DetailRow>
            <DetailRow label="Note">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                “Last updated” reflects the latest save to this row (for example when workflow status changes). It is
                maintained by the database.
              </span>
            </DetailRow>
          </dl>

          <SectionTitle>Workflow &amp; invites</SectionTitle>
          <dl>
            <DetailRow label="Meeting invite sent">{formatDateTime(row.meeting_invite_sent_at)}</DetailRow>
            <DetailRow label="Registration link expires">{formatDateTime(row.registration_token_expires_at)}</DetailRow>
            <DetailRow label="Registration link used">{formatDateTime(row.registration_token_used_at)}</DetailRow>
            <DetailRow label="Registration token">
              {row.registration_token_hash ? "Stored (hash hidden for security)" : "—"}
            </DetailRow>
            <DetailRow label="Vendor registration link">{row.vendor_registration_id ?? "—"}</DetailRow>
          </dl>

          <SectionTitle>Business</SectionTitle>
          <dl>
            <DetailRow label="Business name">{row.business_name}</DetailRow>
            <DetailRow label="Entity type">{row.entity_type}</DetailRow>
            <DetailRow label="Year established">{row.year_established}</DetailRow>
          </dl>

          <SectionTitle>Address</SectionTitle>
          <dl>
            <DetailRow label="City">{row.business_city ?? "—"}</DetailRow>
            <DetailRow label="State / UT">{row.business_state ?? "—"}</DetailRow>
            <DetailRow label="Street &amp; locality">
              <span className="whitespace-pre-wrap">{row.business_address}</span>
            </DetailRow>
          </dl>

          <SectionTitle>Contact</SectionTitle>
          <dl>
            <DetailRow label="Contact person">{row.contact_person_name}</DetailRow>
            <DetailRow label="Role / designation">{row.contact_role ?? "—"}</DetailRow>
            <DetailRow label="Mobile">{row.mobile}</DetailRow>
            <DetailRow label="Email">{row.email}</DetailRow>
            <DetailRow label="ITS number">{row.its_number ?? "—"}</DetailRow>
          </dl>

          <SectionTitle>Programme &amp; capability</SectionTitle>
          <dl>
            <DetailRow label="Categories (main &amp; sub)">
              {formatSelectionsList(eoiCategorySelectionsFromRow(row))}
            </DetailRow>
            <DetailRow label="Departments served (legacy)">{formatJsonList(row.departments_served)}</DetailRow>
            <DetailRow label="Zones / coverage">{formatJsonList(row.zones)}</DetailRow>
            <DetailRow label="Can work in programme area">{row.can_work_in_programme_location ?? "—"}</DetailRow>
            <DetailRow label="Also supplies other locations">{row.also_supplies_other_locations ?? "—"}</DetailRow>
            <DetailRow label="Other supply locations (detail)">
              <span className="whitespace-pre-wrap">{row.other_supply_locations_detail ?? "—"}</span>
            </DetailRow>
            <DetailRow label="Experience (years band)">{row.experience_years}</DetailRow>
            <DetailRow label="Turnover range">{row.turnover_range ?? "—"}</DetailRow>
            <DetailRow label="Capability">
              <span className="whitespace-pre-wrap">{row.capability_description}</span>
            </DetailRow>
            <DetailRow label="Previous work">
              <span className="whitespace-pre-wrap">{row.previous_work ?? "—"}</span>
            </DetailRow>
            <DetailRow label="How they heard">{row.source ?? "—"}</DetailRow>
          </dl>

          <SectionTitle>Tax &amp; compliance</SectionTitle>
          <dl>
            <DetailRow label="PAN">{row.pan_number}</DetailRow>
            <DetailRow label="GST number">{row.gst_number ?? "—"}</DetailRow>
            <DetailRow label="GST status">{row.gst_status}</DetailRow>
            <DetailRow label="MSME status">{row.msme_status ?? "—"}</DetailRow>
            <DetailRow label="Certifications">{row.certifications ?? "—"}</DetailRow>
            <DetailRow label="Declaration accepted">{yesNo(row.declaration_accepted)}</DetailRow>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function EoiAdminPanel({
  submissions,
  onRefresh,
}: {
  submissions: ExpressionOfInterestRow[];
  onRefresh: () => Promise<void>;
}) {
  const [globalSearch, setGlobalSearch] = useState("");
  const [colFilters, setColFilters] = useState<EoiColFilters>(emptyEoiFilters);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const closeDetail = useCallback(() => setDetailId(null), []);

  const searchPool = useMemo(
    () => submissions.filter((s) => matchesGlobalSearch(globalSearch, eoiGlobalSearchBlob(s))),
    [submissions, globalSearch],
  );

  const opt = useMemo(() => {
    const refs: string[] = [];
    const submitted: string[] = [];
    const updated: string[] = [];
    const business: string[] = [];
    const categories: string[] = [];
    const emails: string[] = [];
    const its: string[] = [];
    const status: string[] = [];
    const details: string[] = [];
    const actions: string[] = [];
    for (const s of searchPool) {
      const c = eoiCellValues(s);
      refs.push(c.ref);
      submitted.push(c.submitted);
      updated.push(c.updated);
      business.push(c.business);
      categories.push(c.categories);
      emails.push(c.email);
      its.push(c.its);
      status.push(c.status);
      details.push(c.details);
      actions.push(c.actions);
    }
    return { refs, submitted, updated, business, categories, emails, its, status, details, actions };
  }, [searchPool]);

  const filtered = useMemo(
    () => searchPool.filter((s) => eoiRowMatchesColumnFilters(s, colFilters)),
    [searchPool, colFilters],
  );

  const detailRow = detailId ? (submissions.find((s) => s.id === detailId) ?? null) : null;

  async function patchStatus(id: string, eoi_status: EoiStatus) {
    setBusyId(id);
    setMsg(null);
    const res = await fetch(`/api/admin/eoi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eoi_status }),
    });
    setBusyId(null);
    if (!res.ok) setMsg("Could not update status");
    await onRefresh();
  }

  async function meetingInvite(id: string) {
    setBusyId(id);
    setMsg(null);
    const res = await fetch(`/api/admin/eoi/${id}/meeting-invite`, { method: "POST" });
    const j = (await res.json()) as { emailSent?: boolean; emailError?: string };
    setBusyId(null);
    if (!res.ok) setMsg("Meeting invite failed");
    else setMsg(j.emailSent ? "Table / meeting invite email sent." : `Email not sent: ${j.emailError ?? "unknown"}`);
    await onRefresh();
  }

  async function registrationInvite(id: string) {
    setBusyId(id);
    setMsg(null);
    const res = await fetch(`/api/admin/eoi/${id}/registration-invite`, { method: "POST" });
    const j = (await res.json()) as { emailSent?: boolean; emailError?: string; error?: string };
    setBusyId(null);
    if (!res.ok) setMsg(j.error ?? "Registration invite failed");
    else setMsg(j.emailSent ? "Registration link emailed." : `Email not sent: ${j.emailError ?? "unknown"}`);
    await onRefresh();
  }

  function exportExcel() {
    const stamp = new Date().toISOString().slice(0, 10);
    exportEoiListToXlsx(filtered, `EOI-export-${stamp}.xlsx`);
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
      {detailRow ? <EoiDetailModal row={detailRow} onClose={closeDetail} /> : null}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-amber-950 dark:text-amber-100">Expression of Interest (EOI)</h2>
          <p className="mt-1 max-w-2xl text-sm text-amber-900/90 dark:text-amber-200/80">
            Shortlist by category, send the table discussion email, then send the full registration link after your
            review. Vendors may also open <code className="text-xs">/vendor-registration</code> for direct registration
            (without EOI) or use <code className="text-xs">/vendor-registration?token=…</code> from the invitation email.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={exportExcel}
            className="rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
          >
            Export Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => {
              setGlobalSearch("");
              setColFilters({ ...emptyEoiFilters });
            }}
            className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-100 dark:hover:bg-zinc-800"
          >
            Clear search and filters
          </button>
        </div>
      </div>
      {msg ? <p className="mb-3 text-sm text-amber-900 dark:text-amber-100">{msg}</p> : null}

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="block min-w-0 flex-1 text-sm text-amber-950 dark:text-amber-100">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-200/90">
            Search
          </span>
          <input
            type="search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full max-w-xl rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-amber-800 dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="Search across this table"
            aria-label="Search EOI submissions"
          />
        </label>
        <p className="shrink-0 text-sm tabular-nums text-amber-900 dark:text-amber-200">
          Showing {filtered.length} of {submissions.length}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-amber-200/80 bg-white dark:border-amber-900/50 dark:bg-zinc-900">
        <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
          <thead className="bg-amber-100/80 text-xs font-semibold uppercase text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
            <tr>
              <th className="px-2 py-2">Ref</th>
              <th className="px-2 py-2">Submitted</th>
              <th className="px-2 py-2">Last updated</th>
              <th className="px-2 py-2">Business</th>
              <th className="px-2 py-2">Categories</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">ITS</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Details</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
            <tr className="border-t border-amber-200/60 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-950/30">
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by reference"
                  options={opt.refs}
                  selected={colFilters.ref}
                  onChange={(next) => setColFilters((f) => ({ ...f, ref: next }))}
                  variant="amber"
                />
              </th>
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by submitted date"
                  options={opt.submitted}
                  selected={colFilters.submitted}
                  onChange={(next) => setColFilters((f) => ({ ...f, submitted: next }))}
                  variant="amber"
                />
              </th>
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by last updated"
                  options={opt.updated}
                  selected={colFilters.updated}
                  onChange={(next) => setColFilters((f) => ({ ...f, updated: next }))}
                  variant="amber"
                />
              </th>
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by business name"
                  options={opt.business}
                  selected={colFilters.business}
                  onChange={(next) => setColFilters((f) => ({ ...f, business: next }))}
                  variant="amber"
                />
              </th>
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by categories"
                  options={opt.categories}
                  selected={colFilters.categories}
                  onChange={(next) => setColFilters((f) => ({ ...f, categories: next }))}
                  variant="amber"
                />
              </th>
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by email"
                  options={opt.emails}
                  selected={colFilters.email}
                  onChange={(next) => setColFilters((f) => ({ ...f, email: next }))}
                  variant="amber"
                />
              </th>
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by ITS number"
                  options={opt.its}
                  selected={colFilters.its}
                  onChange={(next) => setColFilters((f) => ({ ...f, its: next }))}
                  variant="amber"
                />
              </th>
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by status"
                  options={opt.status}
                  selected={colFilters.status}
                  onChange={(next) => setColFilters((f) => ({ ...f, status: next }))}
                  variant="amber"
                />
              </th>
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by workflow summary"
                  options={opt.details}
                  selected={colFilters.details}
                  onChange={(next) => setColFilters((f) => ({ ...f, details: next }))}
                  variant="amber"
                />
              </th>
              <th className="px-1 py-1 align-top font-normal normal-case">
                <AdminChecklistFilter
                  ariaLabel="Filter by invite and registration activity"
                  options={opt.actions}
                  selected={colFilters.actions}
                  onChange={(next) => setColFilters((f) => ({ ...f, actions: next }))}
                  variant="amber"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const catSel = eoiCategorySelectionsFromRow(s);
              const catTitle = catSel.map((x) => (x.main ? `${x.main} — ${x.sub}` : x.sub)).join(" | ");
              return (
                <tr key={s.id} className="border-t border-amber-100 dark:border-amber-900/40">
                  <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{s.reference_number}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {formatDateTime(s.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {formatDateTime(s.updated_at)}
                  </td>
                  <td className="max-w-[180px] truncate px-2 py-2 font-medium">{s.business_name}</td>
                  <td className="max-w-[220px] truncate px-2 py-2 text-xs" title={catTitle || undefined}>
                    {catSel.length === 0 ? (
                      "—"
                    ) : catSel.length === 1 ? (
                      <>
                        {catSel[0].main ? (
                          <>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{catSel[0].main}</span>
                            <span className="text-zinc-500 dark:text-zinc-400"> · </span>
                          </>
                        ) : null}
                        <span>{catSel[0].sub}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{catSel.length} selections</span>
                        <span className="block truncate text-zinc-500 dark:text-zinc-400">{catSel[0].sub}</span>
                      </>
                    )}
                  </td>
                  <td className="max-w-[180px] truncate px-2 py-2 text-xs">{s.email}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-mono text-xs tabular-nums">{s.its_number ?? "—"}</td>
                  <td className="px-2 py-2">
                    <select
                      className="max-w-[11rem] rounded border border-zinc-300 bg-white px-1 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-950"
                      value={s.eoi_status}
                      disabled={busyId === s.id}
                      onChange={(e) => void patchStatus(s.id, e.target.value as EoiStatus)}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="space-y-1 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => setDetailId(s.id)}
                      className="mb-1 block w-full rounded border border-zinc-300 bg-zinc-50 px-2 py-1 text-center text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 sm:mb-0 sm:mr-1 sm:inline-block sm:w-auto"
                    >
                      View full
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadEoiAdminDoc(s)}
                      className="block w-full rounded border border-amber-700 bg-amber-50 px-2 py-1 text-center text-[11px] font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/50 sm:inline-block sm:w-auto"
                    >
                      .doc report
                    </button>
                  </td>
                  <td className="space-y-1 px-2 py-2">
                    <button
                      type="button"
                      disabled={busyId === s.id || s.eoi_status === "declined" || s.eoi_status === "registered"}
                      onClick={() => void meetingInvite(s.id)}
                      className="mr-1 block w-full rounded bg-amber-700 px-2 py-1 text-left text-[11px] font-semibold text-white hover:bg-amber-800 disabled:opacity-40 sm:inline-block sm:w-auto"
                    >
                      Email: table session
                    </button>
                    <button
                      type="button"
                      disabled={
                        busyId === s.id ||
                        s.eoi_status === "declined" ||
                        s.eoi_status === "registered" ||
                        (s.eoi_status !== "meeting_invited" && s.eoi_status !== "invited_to_register") ||
                        Boolean(s.registration_token_used_at)
                      }
                      onClick={() => void registrationInvite(s.id)}
                      className="block w-full rounded bg-emerald-700 px-2 py-1 text-left text-[11px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-40 sm:inline-block sm:w-auto"
                    >
                      Email: full registration link
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="p-4 text-center text-sm text-zinc-500">No submissions match.</p> : null}
      </div>
    </section>
  );
}
