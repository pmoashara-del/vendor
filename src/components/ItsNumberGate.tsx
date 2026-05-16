"use client";

const ITS_DIGITS = 8;

export function ItsNumberGate({
  value,
  onChange,
  onContinue,
  onSkip,
  error,
}: {
  value: string;
  onChange: (digits: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  error: string | null;
}) {
  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    onContinue();
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Step 1 of 2
      </p>
      <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">ITS number (optional)</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        If you are from our community, enter your <strong>ITS number</strong> — the 8-digit identification we use to
        recognise community members. Vendors from other communities may skip this step and continue to the full
        registration form.
      </p>

      <form onSubmit={onFormSubmit} className="mt-6">
        <label htmlFor="its_number" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          ITS number <span className="font-normal text-zinc-500">(8 digits, optional)</span>
        </label>
        <input
          id="its_number"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={ITS_DIGITS}
          placeholder="e.g. 12345678"
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-lg tracking-widest text-zinc-900 tabular-nums outline-none ring-emerald-600/30 focus:border-emerald-600 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, ITS_DIGITS))}
        />
        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            Continue to registration form
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-emerald-700 hover:underline dark:text-zinc-400 dark:hover:text-emerald-400"
          >
            Skip — not from our community
          </button>
        </div>
      </form>
    </div>
  );
}
