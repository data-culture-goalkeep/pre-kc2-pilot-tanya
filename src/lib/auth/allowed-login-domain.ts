export function isValidLoginEmail(email: string | null | undefined): boolean {
  const normalizedEmail = (email ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
}
