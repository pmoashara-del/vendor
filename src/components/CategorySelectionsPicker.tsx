"use client";

import {
  EOI_MAIN_CATEGORY_OPTIONS,
  EOI_MAIN_TO_SUB,
  type CategorySelection,
} from "@/lib/eoi/eoi-main-sub-categories";

function isPicked(list: readonly CategorySelection[], main: string, sub: string): boolean {
  return list.some((x) => x.main === main && x.sub === sub);
}

export function CategorySelectionsPicker({
  value,
  onChange,
  variant,
  error,
}: {
  value: readonly CategorySelection[];
  onChange: (next: CategorySelection[]) => void;
  variant: "eoi" | "vendor";
  error?: boolean;
}) {
  function toggle(main: string, sub: string, checked: boolean) {
    if (checked) {
      if (isPicked(value, main, sub)) return;
      onChange([...value, { main, sub }]);
    } else {
      onChange(value.filter((x) => !(x.main === main && x.sub === sub)));
    }
  }

  const sectionClass =
    variant === "eoi"
      ? `rounded-sm border px-3 py-3 ${error ? "border-red-600" : "border-[#e8ddd0]"} bg-white/80`
      : `rounded-lg border px-3 py-3 ${error ? "border-red-600" : "border-zinc-300"} bg-zinc-50/80 dark:border-zinc-600 dark:bg-zinc-900/40`;

  const mainHeading =
    variant === "eoi"
      ? "text-[12px] font-semibold text-[#4a3f35]"
      : "text-sm font-semibold text-zinc-800 dark:text-zinc-100";

  const subLabel =
    variant === "eoi"
      ? "flex cursor-pointer items-start gap-2 text-[13px] text-[#4a3f35]"
      : "flex cursor-pointer items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200";

  const accent = variant === "eoi" ? "accent-[#b8860b]" : "accent-emerald-600";

  return (
    <div className="space-y-3">
      {EOI_MAIN_CATEGORY_OPTIONS.map((main) => {
        const subs = EOI_MAIN_TO_SUB[main];
        if (!subs?.length) return null;
        return (
          <div key={main} className={sectionClass}>
            <p className={mainHeading}>{main}</p>
            <p
              className={
                variant === "eoi"
                  ? "mb-2 mt-1 text-[11px] leading-snug text-[#8a7a6e]"
                  : "mb-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400"
              }
            >
              Select one or more vendor types under this industry. You may open several industries and tick multiple
              boxes.
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {subs.map((sub) => (
                <li key={sub}>
                  <label className={subLabel}>
                    <input
                      type="checkbox"
                      className={`mt-0.5 ${accent}`}
                      checked={isPicked(value, main, sub)}
                      onChange={(e) => toggle(main, sub, e.target.checked)}
                    />
                    <span>{sub}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
