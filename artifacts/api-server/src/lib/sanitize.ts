/** Strip HTML tags and control characters from user-supplied strings */
export function sanitize(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value)
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function sanitizeOpt(value: unknown): string | undefined {
  const s = sanitize(value);
  return s ?? undefined;
}
