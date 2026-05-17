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
