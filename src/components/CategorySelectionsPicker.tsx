"use client";

import { useState } from "react";
import {
  EOI_MAIN_CATEGORY_OPTIONS,
  EOI_MAIN_TO_SUB,
  normalizeCategorySelections,
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
  const [activeMain, setActiveMain] = useState("");

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

  const selectClass =
    variant === "eoi"
      ? `w-full rounded-sm border bg-white px-3.5 py-2.5 text-sm text-[#1a1410] outline-none transition focus:border-[#d4a843] focus:ring-[3px] focus:ring-[rgba(184,134,11,0.1)] ${
        error ? "border-red-600" : "border-[#e8ddd0]"
      }`
      : `w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 ${
        error ? "border-red-600" : "border-zinc-300"
      }`;

  if (variant === "eoi") {
    const subs = activeMain ? EOI_MAIN_TO_SUB[activeMain] : undefined;
    const summary = normalizeCategorySelections(value);

    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4a3f35]">
            Industry (main category)
          </label>
          <select
            className={selectClass}
            value={activeMain}
            onChange={(e) => setActiveMain(e.target.value)}
            aria-invalid={error}
          >
            <option value="">— Select an industry —</option>
            {EOI_MAIN_CATEGORY_OPTIONS.map((main) => (
              <option key={main} value={main}>
                {main}
              </option>
            ))}
          </select>
        </div>
        {subs?.length ? (
          <div className={sectionClass}>
            <p className={mainHeading}>{activeMain}</p>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {subs.map((sub) => (
                <li key={sub}>
                  <label className={subLabel}>
                    <input
                      type="checkbox"
                      className={`mt-0.5 ${accent}`}
                      checked={isPicked(value, activeMain, sub)}
                      onChange={(e) => toggle(activeMain, sub, e.target.checked)}
                    />
                    <span>{sub}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {summary.length > 0 ? (
          <div className="rounded-sm border border-[#e8ddd0] bg-[#fffdf8] px-3 py-2.5 text-[12px] text-[#4a3f35]">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8a7a6e]">
              Your selections ({summary.length})
            </p>
            <ul className="max-h-40 space-y-1 overflow-y-auto leading-snug">
              {summary.map((row, i) => (
                <li key={`${row.main}\u0000${row.sub}\u0000${i}`}>
                  <span className="font-medium text-[#4a3f35]">{row.main}</span>
                  <span className="text-[#8a7a6e]"> — </span>
                  <span>{row.sub}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {EOI_MAIN_CATEGORY_OPTIONS.map((main) => {
        const subs = EOI_MAIN_TO_SUB[main];
        if (!subs?.length) return null;
        return (
          <div key={main} className={sectionClass}>
            <p className={mainHeading}>{main}</p>
            <p
              className="mb-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400"
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
