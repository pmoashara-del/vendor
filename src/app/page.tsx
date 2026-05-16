import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAcT1OJxD2GtHlRFy2lsUBTDELsMVGqdGBynP8Bql1c4TgeNXbQhsKQtg_bMj7qhE_YMm8G_Dr9YCLnXUW8h4hmtqGAaKc8KERaZQuPEbVYUC8sd5XtVGB2iqBDyFkSYxCdWadsIEWYKr2lVs0GEsytnnz73w-2_SJvt9n-0SUG91mxg8pMskcVuN0NupCUUrHM0nWc3smtQ3OIYX8Q3UgktwIl460Qway1QJHaq440EVIBiw2RSuGLf_uFKFdrUL_aA3hIQfPpPjmB";

export const metadata: Metadata = {
  title: "Vendor Portal — Ashara Mubaraka 1448H | Indore Araz",
  description:
    "Expression of Interest for Ashara Mubaraka 1448H vendor empanelment — committee shortlist, discussion, then secure full registration for Indore Araz.",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-vp-background text-vp-on-surface selection:bg-vp-primary-container selection:text-vp-on-primary">
      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative flex h-[min(100vh,600px)] min-h-[480px] w-full items-center justify-center overflow-hidden">
          <Link
            href="/admin"
            className="fixed right-4 top-4 z-50 rounded-full border border-white/25 bg-black/30 px-4 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg backdrop-blur-md transition-all hover:border-white/40 hover:bg-black/45 md:right-8 md:top-6 md:px-5"
          >
            Admin sign-in
          </Link>

          <div className="absolute inset-0">
            <Image
              src={HERO_IMAGE}
              alt="Serene architectural interior with geometric patterns and soft natural light"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-vp-primary/80 mix-blend-multiply" aria-hidden />
            <div
              className="absolute inset-0 bg-gradient-to-t from-vp-primary via-vp-primary/50 to-transparent"
              aria-hidden
            />
          </div>

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-vp-gutter px-vp-margin-mobile text-center md:px-vp-margin-desktop">
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-vp-on-primary sm:text-5xl sm:leading-[3.5rem]">
              Ashara Mubaraka 1448H
            </h1>
            <h2 className="font-display text-2xl font-medium text-vp-secondary-fixed sm:text-[32px] sm:leading-10">
              Indore Araz Vendor Portal
            </h2>
            <p className="mt-1 max-w-2xl font-sans text-lg leading-relaxed text-vp-on-primary/90 sm:text-xl sm:leading-7">
              The Dawoodi Bohra community of Indore humbly requests the honor of hosting Ashara Mubaraka 1448H. Begin
              with an Expression of Interest; shortlisted vendors will be invited to discuss requirements, and formal
              registration follows after committee approval.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/expression-of-interest"
                className="font-display inline-flex min-h-[3.25rem] items-center justify-center rounded-xl bg-vp-secondary px-10 py-3.5 text-base font-semibold tracking-wide text-vp-on-secondary shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-2 ring-white/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#8f6d22] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:ring-white/35 active:translate-y-0"
              >
                Expression of Interest
              </Link>
            </div>
          </div>
        </section>

        {/* Enrollment — informational only; no extra CTAs or nav */}
        <section className="relative w-full overflow-hidden bg-vp-primary-container py-20 text-vp-on-primary-container md:py-24">
          <div className="relative z-10 mx-auto max-w-vp-container-max px-vp-margin-mobile md:px-vp-margin-desktop">
            <div className="mb-12 text-center md:mb-16">
              <h2 className="font-display text-3xl font-medium text-vp-secondary-container sm:text-[32px] sm:leading-10">
                Vendor Enrollment Process
              </h2>
              <div className="mx-auto mt-4 h-px w-24 bg-vp-secondary-container/30" />
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <StepCard
                step="01"
                title="Expression of Interest"
                body="Share your business profile, categories, and capability. The committee reviews all EOIs and shortlists vendors that fit current requirements."
              />
              <StepCard
                step="02"
                title="Discussion & screening"
                body="Shortlisted vendors are invited to present their offering and discuss quotes. This helps us align on quality, scale, and compliance before formal onboarding."
              />
              <StepCard
                step="03"
                title="Formal registration"
                body="If selected after the meeting, you receive a secure link to complete full vendor registration, including statutory and bank details not collected at the EOI stage."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-vp-outline bg-vp-primary px-vp-margin-mobile py-vp-gutter text-vp-on-primary md:px-vp-margin-desktop">
        <div className="mx-auto flex max-w-vp-container-max flex-col items-center gap-2 text-center">
          <div className="font-display text-2xl font-medium">Indore Araz Committee</div>
          <p className="text-sm font-semibold tracking-wide opacity-80">© 1448H Ashara Mubaraka. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-vp-secondary-container/20 bg-vp-surface/5 p-8 backdrop-blur-sm transition-colors hover:bg-vp-surface/10">
      <div className="font-display mb-4 text-2xl font-medium text-vp-secondary-container">{step}</div>
      <h3 className="font-display mb-3 text-2xl font-medium text-vp-on-primary">{title}</h3>
      <p className="font-sans text-base leading-relaxed text-vp-on-primary-container/80">{body}</p>
    </div>
  );
}
