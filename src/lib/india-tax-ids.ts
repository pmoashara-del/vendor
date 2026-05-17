/** Default state code for provisional GSTIN from PAN (Madhya Pradesh — Indore programme). */
export const DEFAULT_GST_STATE_CODE = 23;

export const PAN_REGEX = /^[A-Z]{3}[ABCFGHLJPTF][A-Z]\d{4}[A-Z]$/;
export const GSTIN_REGEX = /^[0-3][0-9][A-Z]{3}[ABCFGHLJPTF][A-Z]\d{4}[A-Z]\d[Z][A-Z0-9]$/;

export function validatePAN(pan: string): boolean {
  return PAN_REGEX.test(pan.toUpperCase());
}

export function validateGSTIN(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin.toUpperCase());
}

/** Embedded PAN inside a GSTIN (characters at indices 2–11). */
export function extractPANFromGSTIN(gstin: string): string {
  return gstin.substring(2, 12).toUpperCase();
}

export function gstinBelongsToPAN(gstin: string, pan: string): boolean {
  return extractPANFromGSTIN(gstin) === pan.toUpperCase();
}

/** First 12 characters of a GSTIN: state code (2) + PAN (10). The final three characters are entered separately. */
export function buildGstinPrefix(pan: string, stateCode: number | string): string {
  const state = String(stateCode).padStart(2, "0");
  return `${state}${pan.toUpperCase().replace(/\s/g, "")}`;
}

/**
 * Builds a 15-character GSTIN from PAN + state + entity serial.
 * Checksum position uses a placeholder — replace with official checksum for production if required.
 */
export function buildGSTIN(pan: string, stateCode: number | string, entityNo: number | string = 1): string {
  return `${buildGstinPrefix(pan, stateCode)}${entityNo}Z5`;
}
