const REF_PATTERN = /^EOI-\d{4}-[A-F0-9]{6}$/;

/** Normalise user input to match stored `reference_number` (e.g. EOI-2026-A1B2C3). */
export function normalizeEoiReference(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/[\s\u200b]+/g, "");
  if (REF_PATTERN.test(t)) return t;
  const compact = t.replace(/-/g, "");
  const m = compact.match(/^EOI(\d{4})([A-F0-9]{6})$/);
  if (m) return `EOI-${m[1]}-${m[2]}`;
  return t;
}

export function isWellFormedEoiReference(ref: string): boolean {
  return REF_PATTERN.test(normalizeEoiReference(ref));
}
