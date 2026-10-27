export const LOGIN_DOMAIN_ERROR = "Please sign in with your goalkeep.net account";

export function normalizeAllowedLoginDomain(domain: string | null | undefined): string | null {
  const normalized = (domain ?? "").trim().replace(/^@+/, "").toLowerCase();
  if (!normalized || normalized.includes("@") || /\s/.test(normalized)) return null;
  return normalized;
}

export function isAllowedLoginEmail(
  email: string | null | undefined,
  allowedDomain: string | null | undefined,
): boolean {
  const domain = normalizeAllowedLoginDomain(allowedDomain);
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  if (!domain || !/^[^\s@]+@[^\s@]+$/.test(normalizedEmail)) return false;
  return normalizedEmail.endsWith(`@${domain}`);
}
