/** PAN / GSTIN helpers for Indian tax identifiers (format checks; GSTIN checksum not verified). */

export const PAN_REGEX = /^[A-Z]{3}[ABCFGHLJPTF][A-Z]\d{4}[A-Z]$/;

export const GSTIN_REGEX = /^[0-3][0-9][A-Z]{3}[ABCFGHLJPTF][A-Z]\d{4}[A-Z]\d[Z][A-Z0-9]$/;

export function validatePAN(pan: string): boolean {
  return PAN_REGEX.test(pan.toUpperCase());
}

export function validateGSTIN(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin.toUpperCase());
}

export function extractPANFromGSTIN(gstin: string): string {
  return gstin.substring(2, 12).toUpperCase();
}

export function gstinBelongsToPAN(gstin: string, pan: string): boolean {
  return extractPANFromGSTIN(gstin) === pan.toUpperCase();
}

/**
 * Builds a 15-character GSTIN-shaped string from PAN + state + entity serial.
 * Last character is a placeholder (not the official GSTIN checksum digit).
 */
export function buildGSTIN(pan: string, stateCode: number | string, entityNo = 1): string {
  const state = String(stateCode).padStart(2, "0");
  const n = typeof entityNo === "number" ? entityNo : parseInt(String(entityNo), 10);
  const digit = Number.isFinite(n) && n >= 1 && n <= 9 ? n : 1;
  return `${state}${pan.toUpperCase()}${digit}Z5`;
}

/** Infer GST state code (first two digits of GSTIN) from free-text state on vendor forms. */
export function gstStateNumericFromVendorState(state: string): number {
  const s = state.trim().toLowerCase().replace(/\s+/g, " ");
  const rules: [string, number][] = [
    ["jammu and kashmir", 1],
    ["ladakh", 38],
    ["himachal pradesh", 2],
    ["punjab", 3],
    ["chandigarh", 4],
    ["uttarakhand", 5],
    ["haryana", 6],
    ["delhi", 7],
    ["rajasthan", 8],
    ["uttar pradesh", 9],
    ["bihar", 10],
    ["sikkim", 11],
    ["arunachal pradesh", 12],
    ["nagaland", 13],
    ["manipur", 14],
    ["mizoram", 15],
    ["tripura", 16],
    ["meghalaya", 17],
    ["assam", 18],
    ["west bengal", 19],
    ["jharkhand", 20],
    ["odisha", 21],
    ["orissa", 21],
    ["chhattisgarh", 22],
    ["madhya pradesh", 23],
    ["gujarat", 24],
    ["dadra and nagar haveli", 26],
    ["daman and diu", 26],
    ["maharashtra", 27],
    ["andhra pradesh", 37],
    ["karnataka", 29],
    ["goa", 30],
    ["kerala", 32],
    ["tamil nadu", 33],
    ["tamilnadu", 33],
    ["puducherry", 34],
    ["pondicherry", 34],
    ["andaman and nicobar", 35],
    ["telangana", 36],
  ];
  for (const [needle, code] of rules) {
    if (s === needle || s.includes(needle)) return code;
  }
  return 23;
}
