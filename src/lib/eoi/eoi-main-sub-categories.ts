/**
 * EOI: broad industry (main category) → vendor type (sub category).
 * Rows with the same broad industry are merged under one main key.
 */

const EOI_MAIN_SUB_ROWS: ReadonlyArray<readonly [main: string, sub: string]> = [
  ["Food & Catering", "Food / Grocery / Kitchen Vendor"],
  ["Miscellaneous", "Administrative / General"],
  ["Electronics & AV", "AV / Audio-Visual Vendor"],
  ["Electronics & AV", "Walkie Talkie / Communication Vendor"],
  ["Electronics & AV", "CCTV / Surveillance Vendor"],
  ["Manpower & Services", "Manpower / Labour Vendor"],
  ["Furniture & Office Setup", "Furniture Vendor"],
  ["Transport & Logistics", "Transport / Vehicle Vendor"],
  ["Cleaning & Hygiene", "Cleaning / Hygiene Vendor"],
  ["IT & Networking", "IT / Network Vendor"],
  ["IT & Networking", "Computer / Hardware Vendor"],
  ["Electrical & HVAC", "AC / Cooling Vendor"],
  ["Pharmaceutical & Medical", "Pharma / Medical Vendor"],
  ["Safety & PPE", "Safety / Fire Safety Vendor"],
  ["Electrical & Hardware", "Electrical / Hardware Vendor"],
  ["Textiles & Fabric", "Textile / Uniform Vendor"],
  ["Printing & Signage", "Printing & Signage Vendor"],
  ["Printing & Signage", "Gifts / PR Vendor"],
  ["Stationery & Office Supplies", "Stationery Vendor"],
  ["Civil & Plumbing", "Civil / Plumbing Vendor"],
];

const { order, map } = (() => {
  const mainOrder: string[] = [];
  const mainToSub: Record<string, string[]> = {};
  for (const [main, sub] of EOI_MAIN_SUB_ROWS) {
    if (!mainToSub[main]) {
      mainToSub[main] = [];
      mainOrder.push(main);
    }
    mainToSub[main].push(sub);
  }
  return { order: mainOrder, map: mainToSub };
})();

/** Unique main categories in display order */
export const EOI_MAIN_CATEGORY_OPTIONS = order as readonly string[];

/** Main → list of vendor types (sub categories) */
export const EOI_MAIN_TO_SUB: Readonly<Record<string, readonly string[]>> = map;

export function subcategoriesForMain(main: string): string[] {
  const subs = EOI_MAIN_TO_SUB[main];
  return subs ? [...subs] : [];
}

export function isValidMainSubPair(main: string, sub: string): boolean {
  if (!main.trim() || !sub.trim()) return false;
  const subs = EOI_MAIN_TO_SUB[main];
  return !!subs && subs.includes(sub);
}

export function isKnownMainCategory(main: string): boolean {
  return Object.prototype.hasOwnProperty.call(EOI_MAIN_TO_SUB, main);
}

/** One broad industry (main) paired with one vendor type (sub). */
export type CategorySelection = Readonly<{ main: string; sub: string }>;

function selectionKey(main: string, sub: string): string {
  return `${main}\u0000${sub}`;
}

/** Trim, drop empties, dedupe by (main, sub), preserve first-seen order. */
export function normalizeCategorySelections(selections: readonly CategorySelection[]): CategorySelection[] {
  const seen = new Set<string>();
  const out: CategorySelection[] = [];
  for (const row of selections) {
    const main = String(row.main ?? "").trim();
    const sub = String(row.sub ?? "").trim();
    if (!main || !sub) continue;
    const k = selectionKey(main, sub);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ main, sub });
  }
  return out;
}

/** True when there is at least one pair and every pair is a valid main→sub mapping. */
export function isValidCategorySelectionsList(selections: readonly CategorySelection[]): boolean {
  const n = normalizeCategorySelections(selections);
  if (n.length === 0) return false;
  return n.every((s) => isValidMainSubPair(s.main, s.sub));
}

/** Unique mains in first-seen order (for legacy `main_category` column). */
export function legacyMainCategoriesSummary(selections: readonly CategorySelection[]): string {
  const n = normalizeCategorySelections(selections);
  const mains: string[] = [];
  for (const s of n) {
    if (!mains.includes(s.main)) mains.push(s.main);
  }
  return mains.join(" · ");
}

/** Human-readable list of pairs (for legacy `primary_category` / `sub_category` columns). */
export function legacyCategoryPairsSummary(selections: readonly CategorySelection[]): string {
  return normalizeCategorySelections(selections)
    .map((s) => `${s.main} — ${s.sub}`)
    .join(" | ");
}
