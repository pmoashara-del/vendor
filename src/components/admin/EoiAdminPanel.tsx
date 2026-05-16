"use client";

import { useMemo, useState } from "react";
import type { ExpressionOfInterestRow, EoiStatus } from "@/types/eoi";

const STATUS_OPTIONS: EoiStatus[] = [
  "submitted",
  "shortlisted",
  "meeting_invited",
  "invited_to_register",
  "declined",
  "registered",
];

export function EoiAdminPanel({
  submissions,
  onRefresh,
}: {
  submissions: ExpressionOfInterestRow[];
  onRefresh: () => Promise<void>;
}) {
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter(
      (s) =>
        s.business_name.toLowerCase().includes(q) ||
        s.primary_category.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.reference_number.toLowerCase().includes(q),
    );
  }, [submissions, filter]);

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

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-amber-950 dark:text-amber-100">Expression of Interest (EOI)</h2>
          <p className="mt-1 max-w-2xl text-sm text-amber-900/90 dark:text-amber-200/80">
            Shortlist vendors (e.g. by category), send <strong>table discussion</strong> email, then after the meeting
            send the <strong>full registration</strong> link. Flow: EOI → shortlist → meeting invite → registration
            invite → vendor completes form on <code className="text-xs">/vendor-registration?token=…</code>
          </p>
        </div>
        <input
          type="search"
          placeholder="Filter by name, category, email, ref…"
          className="w-full max-w-xs rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm dark:border-amber-800 dark:bg-zinc-950"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {msg ? <p className="mb-3 text-sm text-amber-900 dark:text-amber-100">{msg}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-amber-200/80 bg-white dark:border-amber-900/50 dark:bg-zinc-900">
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead className="bg-amber-100/80 text-xs font-semibold uppercase text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
            <tr>
              <th className="px-2 py-2">Ref</th>
              <th className="px-2 py-2">Submitted</th>
              <th className="px-2 py-2">Business</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-amber-100 dark:border-amber-900/40">
                <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">{s.reference_number}</td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {new Date(s.created_at).toLocaleString()}
                </td>
                <td className="max-w-[180px] truncate px-2 py-2 font-medium">{s.business_name}</td>
                <td className="max-w-[160px] truncate px-2 py-2 text-xs">{s.primary_category}</td>
                <td className="max-w-[180px] truncate px-2 py-2 text-xs">{s.email}</td>
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
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="p-4 text-center text-sm text-zinc-500">No submissions match.</p> : null}
      </div>
    </section>
  );
}
