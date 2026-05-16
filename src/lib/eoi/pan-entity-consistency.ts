/**
 * Indian PAN: 4th character indicates type of holder (Income Tax).
 * Cross-check with declared entity type to catch obvious mismatches
 * (e.g. Partnership + individual “P” PAN).
 */

const FOURTH_CHAR_HINT: Record<string, string> = {
  P: "individual (person)",
  C: "company",
  F: "firm, partnership, or LLP",
  H: "HUF",
  T: "trust",
  A: "association of persons (AOP)",
  B: "body of individuals (BOI)",
  L: "local authority",
  J: "artificial juridical person",
  G: "government",
};

/** Allowed 4th characters (uppercase) for each entity type; null = do not validate */
export function expectedPanFourthCharsForEntityType(entityType: string): string[] | null {
  switch (entityType) {
    case "Proprietorship":
      return ["P"];
    case "Partnership":
    case "LLP":
      return ["F"];
    case "Private Limited Company":
    case "Public Limited Company":
      return ["C"];
    case "HUF":
      return ["H"];
    case "Society / Trust":
      return ["T", "A"];
    case "Other":
      return null;
    default:
      return null;
  }
}

export function panFourthCharMatchesEntityType(pan: string, entityType: string): boolean {
  const expected = expectedPanFourthCharsForEntityType(entityType);
  if (expected === null) return true;
  const norm = pan.toUpperCase().replace(/\s/g, "");
  if (norm.length !== 10) return true;
  const fourth = norm[3];
  return expected.includes(fourth);
}

/** Human-readable validation message, or null if OK / not applicable */
export function panEntityConsistencyMessage(entityType: string, pan: string): string | null {
  if (!entityType || entityType === "Other") return null;
  const expected = expectedPanFourthCharsForEntityType(entityType);
  if (expected === null) return null;
  const norm = pan.toUpperCase().replace(/\s/g, "");
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(norm)) return null;
  const fourth = norm[3];
  if (expected.includes(fourth)) return null;
  const got = FOURTH_CHAR_HINT[fourth] ?? `type “${fourth}”`;
  const need = expected
    .map((c) => `${c} (${FOURTH_CHAR_HINT[c] ?? "see Income Tax PAN rules"})`)
    .join(" or ");
  return `For “${entityType}”, the PAN’s 4th letter should be ${need}. Yours is “${fourth}” (${got}). Use the organisation’s PAN or change the entity type.`;
}
