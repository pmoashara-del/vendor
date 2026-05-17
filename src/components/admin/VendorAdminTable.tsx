"use client";

import { useMemo, useState } from "react";
import { AdminChecklistFilter, type ChecklistSelection } from "@/components/admin/AdminChecklistFilter";
import { downloadVendorAdminDoc, exportVendorListToXlsx } from "@/lib/admin/export-reports";
import type { RegistrationStatus, VendorRegistrationRow } from "@/types/vendor";

const STATUS_OPTIONS: RegistrationStatus[] = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "on_hold",
];

const emptyVendorFilters: Record<
  "submitted" | "updated" | "its" | "company" | "type" | "city" | "state" | "contact" | "email" | "gst" | "status",
  ChecklistSelection
> = {
  submitted: null,
  updated: null,
  its: null,
  company: null,
  type: null,
  city: null,
  state: null,
  contact: null,
  email: null,
  gst: null,
  status: null,
};

type VendorColFilters = typeof emptyVendorFilters;

function formatDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function vendorGlobalSearchBlob(v: VendorRegistrationRow): string {
  const parts = [
    formatDateTime(v.created_at),
    formatDateTime(v.updated_at),
    v.its_number ?? "",
    v.company_name,
    v.vendor_type,
    v.city,
    v.state,
    v.primary_contact_person,
    v.email,
    v.gst_registered ? "Yes" : "No",
    v.registration_status.replaceAll("_", " "),
    v.id,
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

function vendorCellValues(v: VendorRegistrationRow) {
  return {
    submitted: formatDateTime(v.created_at),
    updated: formatDateTime(v.updated_at),
    its: v.its_number ?? "—",
    company: v.company_name || "—",
    type: v.vendor_type || "—",
    city: v.city || "—",
    state: v.state || "—",
    contact: v.primary_contact_person || "—",
    email: v.email || "—",
    gst: v.gst_registered ? "Yes" : "No",
    status: v.registration_status.replaceAll("_", " "),
  };
}

function vendorRowMatchesColumnFilters(v: VendorRegistrationRow, f: VendorColFilters): boolean {
  const c = vendorCellValues(v);
  if (!colMatch(f.submitted, c.submitted)) return false;
  if (!colMatch(f.updated, c.updated)) return false;
  if (!colMatch(f.its, c.its)) return false;
  if (!colMatch(f.company, c.company)) return false;
  if (!colMatch(f.type, c.type)) return false;
  if (!colMatch(f.city, c.city)) return false;
  if (!colMatch(f.state, c.state)) return false;
  if (!colMatch(f.contact, c.contact)) return false;
  if (!colMatch(f.email, c.email)) return false;
  if (!colMatch(f.gst, c.gst)) return false;
  if (!colMatch(f.status, c.status)) return false;
  return true;
}

export function VendorAdminTable({
  vendors,
  onOpenVendorAi,
  statusSavingId,
  onPatchStatus,
}: {
  vendors: VendorRegistrationRow[];
  onOpenVendorAi: (v: VendorRegistrationRow) => void;
  statusSavingId: string | null;
  onPatchStatus: (v: VendorRegistrationRow, next: RegistrationStatus) => void | Promise<void>;
}) {
  const [globalSearch, setGlobalSearch] = useState("");
  const [colFilters, setColFilters] = useState<VendorColFilters>(emptyVendorFilters);

  const searchPool = useMemo(
    () => vendors.filter((v) => matchesGlobalSearch(globalSearch, vendorGlobalSearchBlob(v))),
    [vendors, globalSearch],
  );

  const opt = useMemo(() => {
    const submitted: string[] = [];
    const updated: string[] = [];
    const its: string[] = [];
    const company: string[] = [];
    const type: string[] = [];
    const city: string[] = [];
    const state: string[] = [];
    const contact: string[] = [];
    const email: string[] = [];
    const gst: string[] = [];
    const status: string[] = [];
    for (const v of searchPool) {
      const c = vendorCellValues(v);
      submitted.push(c.submitted);
      updated.push(c.updated);
      its.push(c.its);
      company.push(c.company);
      type.push(c.type);
      city.push(c.city);
      state.push(c.state);
      contact.push(c.contact);
      email.push(c.email);
      gst.push(c.gst);
      status.push(c.status);
    }
    return { submitted, updated, its, company, type, city, state, contact, email, gst, status };
  }, [searchPool]);

  const filtered = useMemo(
    () => searchPool.filter((v) => vendorRowMatchesColumnFilters(v, colFilters)),
    [searchPool, colFilters],
  );

  function exportExcel() {
    const stamp = new Date().toISOString().slice(0, 10);
    exportVendorListToXlsx(filtered, `Vendors-export-${stamp}.xlsx`);
  }

  return (
    <section>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Registered vendors</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Use search and column filters, then export the rows you need.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={exportExcel}
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Export Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => {
              setGlobalSearch("");
              setColFilters({ ...emptyVendorFilters });
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Clear search and filters
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="block min-w-0 flex-1 text-sm text-zinc-800 dark:text-zinc-200">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Search
          </span>
          <input
            type="search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full max-w-xl rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="Search across this table"
            aria-label="Search registered vendors"
          />
        </label>
        <p className="shrink-0 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
          Showing {filtered.length} of {vendors.length}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-[1280px] w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-100 text-xs font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <tr>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">ITS</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">GST</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Report</th>
              <th className="px-3 py-2">AI</th>
            </tr>
            <tr className="border-t border-zinc-200 bg-zinc-50/90 text-[10px] font-normal normal-case dark:border-zinc-700 dark:bg-zinc-900/80">
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by submitted date"
                  options={opt.submitted}
                  selected={colFilters.submitted}
                  onChange={(next) => setColFilters((f) => ({ ...f, submitted: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by last updated"
                  options={opt.updated}
                  selected={colFilters.updated}
                  onChange={(next) => setColFilters((f) => ({ ...f, updated: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by ITS number"
                  options={opt.its}
                  selected={colFilters.its}
                  onChange={(next) => setColFilters((f) => ({ ...f, its: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by company"
                  options={opt.company}
                  selected={colFilters.company}
                  onChange={(next) => setColFilters((f) => ({ ...f, company: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by vendor type"
                  options={opt.type}
                  selected={colFilters.type}
                  onChange={(next) => setColFilters((f) => ({ ...f, type: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by city"
                  options={opt.city}
                  selected={colFilters.city}
                  onChange={(next) => setColFilters((f) => ({ ...f, city: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by state"
                  options={opt.state}
                  selected={colFilters.state}
                  onChange={(next) => setColFilters((f) => ({ ...f, state: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by contact"
                  options={opt.contact}
                  selected={colFilters.contact}
                  onChange={(next) => setColFilters((f) => ({ ...f, contact: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by email"
                  options={opt.email}
                  selected={colFilters.email}
                  onChange={(next) => setColFilters((f) => ({ ...f, email: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by GST registered"
                  options={opt.gst}
                  selected={colFilters.gst}
                  onChange={(next) => setColFilters((f) => ({ ...f, gst: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <AdminChecklistFilter
                  ariaLabel="Filter by status"
                  options={opt.status}
                  selected={colFilters.status}
                  onChange={(next) => setColFilters((f) => ({ ...f, status: next }))}
                  variant="zinc"
                />
              </th>
              <th className="px-1 py-1 align-top text-zinc-400">—</th>
              <th className="px-1 py-1 align-top text-zinc-400">—</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {formatDateTime(v.created_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {formatDateTime(v.updated_at)}
                </td>
                <td className="px-3 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">{v.its_number ?? "—"}</td>
                <td className="px-3 py-2 font-medium">{v.company_name}</td>
                <td className="max-w-[120px] truncate px-3 py-2" title={v.vendor_type}>
                  {v.vendor_type}
                </td>
                <td className="px-3 py-2">{v.city}</td>
                <td className="px-3 py-2">{v.state}</td>
                <td className="max-w-[120px] truncate px-3 py-2" title={v.primary_contact_person}>
                  {v.primary_contact_person}
                </td>
                <td className="max-w-[160px] truncate px-3 py-2 text-xs">{v.email}</td>
                <td className="px-3 py-2">{v.gst_registered ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  <select
                    className="max-w-[9.5rem] rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs capitalize dark:border-zinc-600 dark:bg-zinc-950"
                    value={v.registration_status}
                    disabled={statusSavingId === v.id}
                    onChange={(e) => {
                      void onPatchStatus(v, e.target.value as RegistrationStatus);
                    }}
                    aria-label={`Status for ${v.company_name}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => downloadVendorAdminDoc(v)}
                    className="rounded-md border border-amber-600 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/40"
                  >
                    .doc
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onOpenVendorAi(v)}
                    className="rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-900/60"
                  >
                    Insight
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-zinc-500">No vendors match the current filters.</p>
        ) : null}
      </div>
    </section>
  );
}
