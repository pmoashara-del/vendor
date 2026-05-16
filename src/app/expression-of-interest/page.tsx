import Link from "next/link";
import { ExpressionOfInterestForm } from "@/components/ExpressionOfInterestForm";

export const metadata = {
  title: "Expression of Interest — Vendor Empanelment",
  description: "Submit your Expression of Interest for Ashara Mubaraka 1448H vendor empanelment.",
};

export default function ExpressionOfInterestPage() {
  return (
    <>
      <header className="px-6 pb-6 pt-14 text-center">
        <p className="mb-3 font-[family-name:var(--font-cormorant)] text-[13px] font-semibold uppercase tracking-[0.35em] text-[#b8860b]">
          Vendor Empanelment Programme
        </p>
        <h1 className="font-[family-name:var(--font-cormorant)] text-[clamp(2rem,5vw,3.25rem)] font-bold leading-tight text-[#1a1410]">
          Expression of Interest
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[13px] tracking-wide text-[#8a7a6e]">
          Kindly fill all required sections accurately · Shortlisted vendors will be contacted for verification
        </p>
        <div className="mx-auto mt-6 flex max-w-md items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#b8860b]" />
          <span className="text-lg text-[#b8860b]">✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#b8860b]" />
        </div>
        <p className="mt-6">
          <Link href="/" className="text-sm text-[#7c3a1e] underline-offset-2 hover:underline">
            ← Back to home
          </Link>
        </p>
      </header>
      <ExpressionOfInterestForm />
    </>
  );
}
