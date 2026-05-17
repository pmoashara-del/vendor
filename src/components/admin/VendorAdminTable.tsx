"use client";

import { useMemo, useState } from "react";
import { downloadVendorAdminDoc, exportVendorListToXlsx } from "@/lib/admin/export-reports";
import type { RegistrationStatus, VendorRegistrationRow } from "@/types/vendor";

const STATUS_OPTIONS: RegistrationStatus[] = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "on_hold",
];

const emptyVendorFilters = {
  submitted: "",
  updated: "",
  its: "",
  company: "",
  type: "",
  city: "",
  state: "",
  contact: "",
  email: "",
  gst: "",
  status: "" as "" | RegistrationStatus,
};

type VendorColFilters = typeof emptyVendorFilters;

function filterInputClass() {
  return "w-full min-w-0 rounded border border-zinc-300 bg-white px-1.5 py-1 text-[11px] text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";
}

function formatDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function vendorRowMatchesFilters(v: VendorRegistrationRow, f: VendorColFilters): boolean {
  const inc = (hay: string | null | undefined, needle: string) => {
    const n = needle.trim().toLowerCase();
    if (!n) return true;
    return (hay ?? "").toLowerCase().includes(n);
  };
  const subFmt = formatDateTime(v.created_at).toLowerCase();
  if (!inc(v.created_at, f.submitted) && !inc(subFmt, f.submitted)) return false;
  const updFmt = formatDateTime(v.updated_at).toLowerCase();
  if (!inc(v.updated_at, f.updated) && !inc(updFmt, f.updated)) return false;
  const its = (v.its_number ?? "").replace(/\D/g, "");
  const itsQ = f.its.replace(/\D/g, "");
  if (itsQ && !its.includes(itsQ)) return false;
  if (f.its.trim() && !itsQ && !inc(v.its_number, f.its)) return false;
  if (!inc(v.company_name, f.company)) return false;
  if (!inc(v.vendor_type, f.type)) return false;
  if (!inc(v.city, f.city)) return false;
  if (!inc(v.state, f.state)) return false;
  if (!inc(v.primary_contact_person, f.contact)) return false;
  if (!inc(v.email, f.email)) return false;
  const gstLabel = v.gst_registered ? "yes" : "no";
  if (f.gst.trim() && !gstLabel.includes(f.gst.trim().toLowerCase())) return false;
  if (f.status && v.registration_status !== f.status) return false;
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
  const [colFilters, setColFilters] = useState<VendorColFilters>(emptyVendorFilters);

  const filtered = useMemo(
    () => vendors.filter((v) => vendorRowMatchesFilters(v, colFilters)),
    [vendors, colFilters],
  );

  function exportExcel() {
    const stamp = new Date().toISOString().slice(0, 10);
    exportVendorListToXlsx(filtered, `Vendors-export-${stamp}.xlsx`);
  }

  return (
    <section>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Registered vendors</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Filter each column from the row under the headers. Excel includes <strong>workflow_summary</strong>{" "}
            (status, linked EOI, timestamps). Exports respect active filters. Showing{" "}
            <strong>{filtered.length}</strong> of {vendors.length}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportExcel}
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Export Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => setColFilters({ ...emptyVendorFilters })}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Clear column filters
          </button>
        </div>
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
                <input
                  className={filterInputClass()}
                  value={colFilters.submitted}
                  onChange={(e) => setColFilters((f) => ({ ...f, submitted: e.target.value }))}
                  placeholder="Date…"
                  aria-label="Filter submitted"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <input
                  className={filterInputClass()}
                  value={colFilters.updated}
                  onChange={(e) => setColFilters((f) => ({ ...f, updated: e.target.value }))}
                  placeholder="Date…"
                  aria-label="Filter last updated"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <input
                  className={filterInputClass()}
                  value={colFilters.its}
                  onChange={(e) => setColFilters((f) => ({ ...f, its: e.target.value }))}
                  placeholder="ITS…"
                  aria-label="Filter ITS"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <input
                  className={filterInputClass()}
                  value={colFilters.company}
                  onChange={(e) => setColFilters((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Company…"
                  aria-label="Filter company"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <input
                  className={filterInputClass()}
                  value={colFilters.type}
                  onChange={(e) => setColFilters((f) => ({ ...f, type: e.target.value }))}
                  placeholder="Type…"
                  aria-label="Filter vendor type"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <input
                  className={filterInputClass()}
                  value={colFilters.city}
                  onChange={(e) => setColFilters((f) => ({ ...f, city: e.target.value }))}
                  placeholder="City…"
                  aria-label="Filter city"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <input
                  className={filterInputClass()}
                  value={colFilters.state}
                  onChange={(e) => setColFilters((f) => ({ ...f, state: e.target.value }))}
                  placeholder="State…"
                  aria-label="Filter state"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <input
                  className={filterInputClass()}
                  value={colFilters.contact}
                  onChange={(e) => setColFilters((f) => ({ ...f, contact: e.target.value }))}
                  placeholder="Contact…"
                  aria-label="Filter contact"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <input
                  className={filterInputClass()}
                  value={colFilters.email}
                  onChange={(e) => setColFilters((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email…"
                  aria-label="Filter email"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <input
                  className={filterInputClass()}
                  value={colFilters.gst}
                  onChange={(e) => setColFilters((f) => ({ ...f, gst: e.target.value }))}
                  placeholder="yes / no"
                  aria-label="Filter GST registered"
                />
              </th>
              <th className="px-1 py-1 align-top">
                <select
                  className={filterInputClass()}
                  value={colFilters.status}
                  onChange={(e) =>
                    setColFilters((f) => ({ ...f, status: e.target.value as VendorColFilters["status"] }))
                  }
                  aria-label="Filter status"
                >
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
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
