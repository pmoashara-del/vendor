"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { VendorRegistrationForm } from "@/components/VendorRegistrationForm";

function VendorRegistrationWithToken() {
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const eoi = sp.get("eoi") ?? "";
  return (
    <>
      {token.trim() ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/90 p-5 text-sm text-emerald-950 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
          You opened a <strong>committee registration link</strong>. Your email on submit must match the Expression of
          Interest on file for this invitation.
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          You may register <strong>without</strong> a prior Expression of Interest. If you already submitted an EOI, use
          your <strong>EOI reference ID</strong> in the form to avoid re-entering the same details. You can still submit a
          new{" "}
          <Link href="/expression-of-interest" className="font-semibold text-emerald-700 underline dark:text-emerald-400">
            Expression of Interest
          </Link>{" "}
          separately if you wish.
        </div>
      )}
      <VendorRegistrationForm invitationToken={token.trim()} initialEoiReference={eoi.trim()} />
    </>
  );
}

export default function VendorRegistrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 text-zinc-900 dark:from-zinc-950 dark:to-zinc-950 dark:text-zinc-50">
      <header className="print:hidden border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Formal registration
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-cormorant)] text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Vendor registration
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Complete statutory, bank, and compliance details for procurement. Fields mirror your legal entity and tax
              records — keep PAN, GSTIN, and bank data consistent with your documents.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            ← Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
          <VendorRegistrationWithToken />
        </Suspense>
      </main>
    </div>
  );
}
