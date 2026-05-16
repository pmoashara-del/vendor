"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { VendorRegistrationForm } from "@/components/VendorRegistrationForm";

function VendorRegistrationWithToken() {
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  return (
    <>
      {!token.trim() ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          This page is only for vendors who received a <strong>registration invitation</strong> link by email after
          the committee meeting. If you are applying for the first time, please submit an{" "}
          <Link href="/expression-of-interest" className="font-semibold text-emerald-800 underline">
            Expression of Interest
          </Link>{" "}
          first.
        </div>
      ) : null}
      <VendorRegistrationForm invitationToken={token} />
    </>
  );
}

export default function VendorRegistrationPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Formal registration
            </p>
            <h1 className="text-xl font-bold">Vendor registration (full)</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
          <VendorRegistrationWithToken />
        </Suspense>
      </main>
    </div>
  );
}
