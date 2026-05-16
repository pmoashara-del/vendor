/**
 * Indian GST: first two digits of GSTIN are the state / UT code.
 * Used to suggest a provisional GSTIN from PAN + registered state (and city hint).
 */

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
/** 15-char GSTIN shape used by CBIC (checksum position is not fully validated here). */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]{3}$/i;

/** Official state & UT names (as shown in dropdown) → numeric GST state code */
export const GST_STATE_NAME_TO_CODE: Record<string, number> = {
  "Jammu and Kashmir": 1,
  "Himachal Pradesh": 2,
  Punjab: 3,
  Chandigarh: 4,
  Uttarakhand: 5,
  Haryana: 6,
  Delhi: 7,
  Rajasthan: 8,
  "Uttar Pradesh": 9,
  Bihar: 10,
  Sikkim: 11,
  "Arunachal Pradesh": 12,
  Nagaland: 13,
  Manipur: 14,
  Mizoram: 15,
  Tripura: 16,
  Meghalaya: 17,
  Assam: 18,
  "West Bengal": 19,
  Jharkhand: 20,
  Odisha: 21,
  Chhattisgarh: 22,
  "Madhya Pradesh": 23,
  Gujarat: 24,
  "Dadra and Nagar Haveli and Daman and Diu": 26,
  Maharashtra: 27,
  Karnataka: 29,
  Goa: 30,
  Lakshadweep: 31,
  Kerala: 32,
  "Tamil Nadu": 33,
  Puducherry: 34,
  "Andaman and Nicobar Islands": 35,
  Telangana: 36,
  "Andhra Pradesh": 37,
  Ladakh: 38,
  "Other Territory": 97,
};

/** Common city / town spellings (lowercase) → state name key in GST_STATE_NAME_TO_CODE */
export const GST_CITY_HINT_TO_STATE: Record<string, string> = {
  indore: "Madhya Pradesh",
  bhopal: "Madhya Pradesh",
  ujjain: "Madhya Pradesh",
  gwalior: "Madhya Pradesh",
  jabalpur: "Madhya Pradesh",
  ratlam: "Madhya Pradesh",
  dewas: "Madhya Pradesh",
  dhar: "Madhya Pradesh",
  mumbai: "Maharashtra",
  pune: "Maharashtra",
  nagpur: "Maharashtra",
  ahmedabad: "Gujarat",
  surat: "Gujarat",
  vadodara: "Gujarat",
  jaipur: "Rajasthan",
  udaipur: "Rajasthan",
  kolkata: "West Bengal",
  chennai: "Tamil Nadu",
  coimbatore: "Tamil Nadu",
  hyderabad: "Telangana",
  bengaluru: "Karnataka",
  bangalore: "Karnataka",
  kochi: "Kerala",
  thiruvananthapuram: "Kerala",
  delhi: "Delhi",
  "new delhi": "Delhi",
  noida: "Uttar Pradesh",
  lucknow: "Uttar Pradesh",
  kanpur: "Uttar Pradesh",
  patna: "Bihar",
};

export const GST_STATE_OPTIONS = Object.keys(GST_STATE_NAME_TO_CODE).sort((a, b) => a.localeCompare(b));

function norm(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export function validatePAN(pan: string): boolean {
  return PAN_REGEX.test(pan.trim());
}

export function validateGSTIN(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  return g.length === 15 && GSTIN_REGEX.test(g);
}

export function extractPANFromGSTIN(gstin: string): string {
  return gstin.substring(2, 12).toUpperCase();
}

export function gstinBelongsToPAN(gstin: string, pan: string): boolean {
  return extractPANFromGSTIN(gstin) === pan.toUpperCase();
}

/** Resolve GST state code from selected state name; optionally infer state from city hint. */
export function resolveGstStateCode(stateName: string, cityName: string): number | null {
  const st = norm(stateName);
  if (st) {
    const direct = GST_STATE_NAME_TO_CODE[st];
    if (direct != null) return direct;
    const found = Object.keys(GST_STATE_NAME_TO_CODE).find((k) => k.toLowerCase() === st.toLowerCase());
    if (found) return GST_STATE_NAME_TO_CODE[found]!;
  }
  const cityKey = norm(cityName).toLowerCase();
  if (!cityKey) return null;
  const words = cityKey.split(/[\s,]+/).filter(Boolean);
  for (const w of words) {
    const stateFromCity = GST_CITY_HINT_TO_STATE[w];
    if (stateFromCity) {
      const code = GST_STATE_NAME_TO_CODE[stateFromCity];
      if (code != null) return code;
    }
  }
  const whole = GST_CITY_HINT_TO_STATE[cityKey.replace(/,/g, "").trim()];
  if (whole) {
    const code = GST_STATE_NAME_TO_CODE[whole];
    if (code != null) return code;
  }
  return null;
}

/** Provisional GSTIN (checksum digit is a placeholder — replace for production if required). */
export function buildGSTIN(pan: string, stateCode: number, entityNo: number | string = 1): string {
  const state = String(stateCode).padStart(2, "0");
  return `${state}${pan.toUpperCase().replace(/\s/g, "")}${entityNo}Z5`;
}

export function suggestGstinFromPanAndLocation(opts: {
  pan: string;
  city: string;
  state: string;
  previousGstin: string;
}): string {
  const panNorm = opts.pan.toUpperCase().replace(/\s/g, "").slice(0, 10);
  if (!validatePAN(panNorm)) return opts.previousGstin;
  const code = resolveGstStateCode(opts.state, opts.city);
  if (code == null) return opts.previousGstin;
  const built = buildGSTIN(panNorm, code, 1);
  const g = opts.previousGstin.trim().toUpperCase();
  if (!g) return built;
  if (validateGSTIN(g) && !gstinBelongsToPAN(g, panNorm)) return opts.previousGstin;
  return built;
}
