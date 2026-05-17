import { normalizeCategorySelections, type CategorySelection } from "@/lib/eoi/eoi-main-sub-categories";
import type { ExpressionOfInterestRow } from "@/types/eoi";

export function eoiCategorySelectionsFromRow(row: ExpressionOfInterestRow): CategorySelection[] {
  const raw = row.category_selections;
  if (Array.isArray(raw)) {
    const tuples: CategorySelection[] = [];
    for (const item of raw) {
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const main = typeof o.main === "string" ? o.main : "";
        const sub = typeof o.sub === "string" ? o.sub : "";
        tuples.push({ main, sub });
      }
    }
    const n = normalizeCategorySelections(tuples);
    if (n.length > 0) return n;
  }
  const m = row.main_category?.trim() ?? "";
  const s = row.primary_category?.trim() ?? "";
  if (m && s) return [{ main: m, sub: s }];
  if (s) return [{ main: "", sub: s }];
  return [];
}

export function eoiCategorySummaryLine(row: ExpressionOfInterestRow): string {
  const sel = eoiCategorySelectionsFromRow(row);
  if (!sel.length) return "";
  return sel.map((x) => (x.main ? `${x.main} — ${x.sub}` : x.sub)).join(" | ");
}

export function selectionsSearchBlob(selections: CategorySelection[]): string {
  return selections.map((x) => `${x.main} ${x.sub}`).join(" ").toLowerCase();
}
