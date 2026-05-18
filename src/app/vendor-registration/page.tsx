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
      {token.trim() ? (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
          You opened a <strong>committee registration link</strong>. Your email on submit must match the Expression
          of Interest on file for this invitation.
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          You may register <strong>directly</strong> here without submitting an Expression of Interest. If you already
          submitted an EOI, you can optionally fetch matching details using your EOI reference or mobile number below the
          form intro. You
          may still start an{" "}
          <Link href="/expression-of-interest" className="font-semibold text-emerald-700 underline dark:text-emerald-400">
            Expression of Interest
          </Link>{" "}
          separately if you wish.
        </div>
      )}
      <VendorRegistrationForm invitationToken={token.trim()} />
    </>
  );
}

export default function VendorRegistrationPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="print:hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Formal registration
            </p>
            <h1 className="text-xl font-bold">Vendor registration form</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Please fill in all applicable details. You may register with or without a prior Expression of Interest.
            </p>
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
