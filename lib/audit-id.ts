export function normalizeAuditId(value: unknown): string | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  }

  if (typeof value === "bigint") {
    return normalizeAuditId(value.toString());
  }

  if (typeof value !== "string" || !/^[0-9]+$/.test(value)) {
    return null;
  }

  const normalized = value.replace(/^0+/, "");
  if (normalized.length === 0) return null;

  const postgresBigintMax = "9223372036854775807";
  if (
    normalized.length > postgresBigintMax.length
    || (normalized.length === postgresBigintMax.length && normalized > postgresBigintMax)
  ) {
    return null;
  }

  return normalized;
}
