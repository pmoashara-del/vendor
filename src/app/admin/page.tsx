"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EoiAdminPanel } from "@/components/admin/EoiAdminPanel";
import type { VendorPortfolioAnalysis } from "@/lib/ai/openai-analyze";
import type { ExpressionOfInterestRow } from "@/types/eoi";
import type { RegistrationStatus, VendorRegistrationRow } from "@/types/vendor";

const STATUS_OPTIONS: RegistrationStatus[] = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "on_hold",
];

interface Metrics {
  total: number;
  newThisWeek: number;
  gstRegistered: number;
  msmeRegistered: number;
  byStatus: Record<string, number>;
  byVendorType: Record<string, number>;
  byState: Record<string, number>;
}

interface SingleVendorAnalysis {
  executive_summary: string;
  fit_assessment: string;
  diligence_flags: string[];
  suggested_follow_ups: string[];
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [busyLogin, setBusyLogin] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [vendors, setVendors] = useState<VendorRegistrationRow[] | null>(null);
  const [eoiSubmissions, setEoiSubmissions] = useState<ExpressionOfInterestRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [portfolioAiLoading, setPortfolioAiLoading] = useState(false);
  const [portfolioAiError, setPortfolioAiError] = useState<string | null>(null);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<VendorPortfolioAnalysis | null>(null);

  const [vendorModal, setVendorModal] = useState<{ id: string; company: string } | null>(null);
  const [vendorAiLoading, setVendorAiLoading] = useState(false);
  const [vendorAiError, setVendorAiError] = useState<string | null>(null);
  const [vendorAiResult, setVendorAiResult] = useState<SingleVendorAnalysis | null>(null);

  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadError(null);
    const [mRes, vRes, eRes] = await Promise.all([
      fetch("/api/admin/metrics"),
      fetch("/api/admin/vendors"),
      fetch("/api/admin/eoi"),
    ]);
    if (mRes.status === 401 || vRes.status === 401 || eRes.status === 401) {
      setMetrics(null);
      setVendors(null);
      setEoiSubmissions(null);
      setLoadError(null);
      return;
    }
    if (!mRes.ok || !vRes.ok) {
      setLoadError("Could not load dashboard. Check Supabase service role and server logs.");
      return;
    }
    const mJson = (await mRes.json()) as Metrics;
    const vJson = (await vRes.json()) as { vendors: VendorRegistrationRow[] };
    setMetrics(mJson);
    setVendors(vJson.vendors);
    if (eRes.ok) {
      const eJson = (await eRes.json()) as { submissions: ExpressionOfInterestRow[] };
      setEoiSubmissions(eJson.submissions ?? []);
    } else {
      setEoiSubmissions([]);
    }
  }, []);

  async function patchVendorStatus(v: VendorRegistrationRow, next: RegistrationStatus) {
    if (next === v.registration_status) return;
    const prev = v.registration_status;
    setStatusSavingId(v.id);
    setVendors((list) =>
      list ? list.map((x) => (x.id === v.id ? { ...x, registration_status: next } : x)) : null,
    );
    try {
      const res = await fetch(`/api/admin/vendors/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_status: next }),
      });
      if (!res.ok) {
        setVendors((list) =>
          list ? list.map((x) => (x.id === v.id ? { ...x, registration_status: prev } : x)) : null,
        );
        return;
      }
      await loadData();
    } catch {
      setVendors((list) =>
        list ? list.map((x) => (x.id === v.id ? { ...x, registration_status: prev } : x)) : null,
      );
    } finally {
      setStatusSavingId(null);
    }
  }

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusyLogin(true);
    setAuthError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusyLogin(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setAuthError(j.error ?? "Login failed");
      return;
    }
    setPassword("");
    await loadData();
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setMetrics(null);
    setVendors(null);
    setEoiSubmissions(null);
    setPortfolioAnalysis(null);
    setPortfolioAiError(null);
    await loadData();
  }

  async function runPortfolioAi() {
    setPortfolioAiLoading(true);
    setPortfolioAiError(null);
    try {
      const res = await fetch("/api/admin/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { error?: string; analysis?: VendorPortfolioAnalysis };
      if (!res.ok) {
        setPortfolioAiError(data.error ?? "Analysis failed");
        setPortfolioAnalysis(null);
        return;
      }
      if (data.analysis) setPortfolioAnalysis(data.analysis);
    } catch {
      setPortfolioAiError("Network error");
      setPortfolioAnalysis(null);
    } finally {
      setPortfolioAiLoading(false);
    }
  }

  async function openVendorAi(v: VendorRegistrationRow) {
    setVendorModal({ id: v.id, company: v.company_name });
    setVendorAiResult(null);
    setVendorAiError(null);
    setVendorAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: v.id }),
      });
      const data = (await res.json()) as { error?: string; analysis?: SingleVendorAnalysis };
      if (!res.ok) {
        setVendorAiError(data.error ?? "Analysis failed");
        return;
      }
      if (data.analysis) setVendorAiResult(data.analysis);
    } catch {
      setVendorAiError("Network error");
    } finally {
      setVendorAiLoading(false);
    }
  }

  const loggedIn = metrics !== null && vendors !== null && eoiSubmissions !== null;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Admin
            </p>
            <h1 className="text-xl font-bold">Vendor management dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Home
            </Link>
            <Link
              href="/expression-of-interest"
              className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              EOI form
            </Link>
            {loggedIn ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {!loggedIn ? (
          <form
            onSubmit={login}
            className="mx-auto max-w-md space-y-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-lg font-semibold">Administrator sign-in</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Enter the dashboard password configured in <code className="text-xs">ADMIN_DASHBOARD_PASSWORD</code>.
            </p>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
            <button
              type="submit"
              disabled={busyLogin}
              className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busyLogin ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : null}

        {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

        {metrics && vendors && eoiSubmissions ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Total vendors" value={metrics.total} hint="All registrations" />
              <MetricCard title="New (7 days)" value={metrics.newThisWeek} hint="Recently submitted" />
              <MetricCard title="GST registered" value={metrics.gstRegistered} hint="Flagged as GST" />
              <MetricCard title="MSME registered" value={metrics.msmeRegistered} hint="MSME on file" />
            </section>

            <EoiAdminPanel submissions={eoiSubmissions} onRefresh={loadData} />

            <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm dark:border-violet-900/50 dark:from-violet-950/40 dark:to-zinc-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-violet-950 dark:text-violet-100">AI vendor intelligence</h2>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                    Portfolio-level insights from the latest registrations (sanitized: no PAN, GSTIN, bank numbers, or
                    full email — only business profile signals). Requires{" "}
                    <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">OPENAI_API_KEY</code> in{" "}
                    <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">.env.local</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void runPortfolioAi()}
                  disabled={portfolioAiLoading}
                  className="shrink-0 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {portfolioAiLoading ? "Analyzing…" : "Run portfolio analysis"}
                </button>
              </div>
              {portfolioAiError ? <p className="mt-3 text-sm text-red-600">{portfolioAiError}</p> : null}
              {portfolioAnalysis ? (
                <div className="mt-6 space-y-6 border-t border-violet-200/80 pt-6 dark:border-violet-800/60">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                      Executive summary
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                      {portfolioAnalysis.executive_summary}
                    </p>
                  </div>
                  {portfolioAnalysis.key_metrics.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                        AI-derived metrics
                      </h3>
                      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                        {portfolioAnalysis.key_metrics.map((m, i) => (
                          <li
                            key={`${m.label}-${i}`}
                            className="rounded-lg border border-zinc-200 bg-white/90 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950/80"
                          >
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{m.label}</p>
                            <p className="mt-0.5 text-lg font-bold text-violet-700 dark:text-violet-300">{m.value}</p>
                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{m.note}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="grid gap-6 md:grid-cols-3">
                    <BulletBlock title="Strengths" items={portfolioAnalysis.strengths} tone="emerald" />
                    <BulletBlock title="Risks / gaps" items={portfolioAnalysis.risks_or_gaps} tone="amber" />
                    <BulletBlock title="Recommended actions" items={portfolioAnalysis.recommended_actions} tone="sky" />
                  </div>
                  {portfolioAnalysis.diversity_or_coverage_note ? (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                        Coverage & diversity
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {portfolioAnalysis.diversity_or_coverage_note}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <Breakdown title="By status" data={metrics.byStatus} />
              <Breakdown title="By vendor type" data={metrics.byVendorType} />
              <Breakdown title="By state" data={metrics.byState} />
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Registered vendors</h2>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
                  <thead className="bg-zinc-100 text-xs font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <tr>
                      <th className="px-3 py-2">Submitted</th>
                      <th className="px-3 py-2">ITS</th>
                      <th className="px-3 py-2">Company</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">City</th>
                      <th className="px-3 py-2">State</th>
                      <th className="px-3 py-2">Contact</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">GST</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr key={v.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                          {new Date(v.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">
                          {v.its_number ?? "—"}
                        </td>
                        <td className="px-3 py-2 font-medium">{v.company_name}</td>
                        <td className="px-3 py-2">{v.vendor_type}</td>
                        <td className="px-3 py-2">{v.city}</td>
                        <td className="px-3 py-2">{v.state}</td>
                        <td className="px-3 py-2">{v.primary_contact_person}</td>
                        <td className="px-3 py-2">{v.email}</td>
                        <td className="px-3 py-2">{v.gst_registered ? "Yes" : "No"}</td>
                        <td className="px-3 py-2">
                          <select
                            className="max-w-[9.5rem] rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs capitalize dark:border-zinc-600 dark:bg-zinc-950"
                            value={v.registration_status}
                            disabled={statusSavingId === v.id}
                            onChange={(e) => {
                              void patchVendorStatus(v, e.target.value as RegistrationStatus);
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
                            onClick={() => void openVendorAi(v)}
                            className="rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-900/60"
                          >
                            Insight
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </main>

      {vendorModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-ai-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
              <h2 id="vendor-ai-title" className="text-lg font-semibold text-violet-900 dark:text-violet-100">
                AI insight — {vendorModal.company}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setVendorModal(null);
                  setVendorAiResult(null);
                  setVendorAiError(null);
                }}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {vendorAiLoading ? <p className="mt-4 text-sm text-zinc-600">Generating insight…</p> : null}
            {vendorAiError ? <p className="mt-4 text-sm text-red-600">{vendorAiError}</p> : null}
            {vendorAiResult ? (
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Summary</h3>
                  <p className="mt-1 leading-relaxed text-zinc-700 dark:text-zinc-300">{vendorAiResult.executive_summary}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">Fit assessment</h3>
                  <p className="mt-1 leading-relaxed text-zinc-700 dark:text-zinc-300">{vendorAiResult.fit_assessment}</p>
                </div>
                {vendorAiResult.diligence_flags.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">Diligence flags</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
                      {vendorAiResult.diligence_flags.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {vendorAiResult.suggested_follow_ups.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-sky-800 dark:text-sky-200">Suggested follow-ups</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
                      {vendorAiResult.suggested_follow_ups.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ title, value, hint }: { title: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{title}</h3>
      <ul className="space-y-2 text-sm">
        {entries.length === 0 ? <li className="text-zinc-500">No data yet</li> : null}
        {entries.map(([k, n]) => (
          <li key={k} className="flex justify-between gap-2 border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">
            <span className="truncate text-zinc-700 dark:text-zinc-200">{k || "(blank)"}</span>
            <span className="shrink-0 font-semibold tabular-nums">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BulletBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber" | "sky";
}) {
  const border =
    tone === "emerald"
      ? "border-emerald-200 dark:border-emerald-900/50"
      : tone === "amber"
        ? "border-amber-200 dark:border-amber-900/50"
        : "border-sky-200 dark:border-sky-900/50";
  const titleC =
    tone === "emerald"
      ? "text-emerald-900 dark:text-emerald-200"
      : tone === "amber"
        ? "text-amber-900 dark:text-amber-200"
        : "text-sky-900 dark:text-sky-200";
  if (!items.length) return null;
  return (
    <div className={`rounded-lg border ${border} bg-white/60 p-3 dark:bg-zinc-950/40`}>
      <h4 className={`text-xs font-semibold uppercase tracking-wide ${titleC}`}>{title}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
