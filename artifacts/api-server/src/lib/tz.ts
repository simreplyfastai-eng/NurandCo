const TZ = "Europe/London";

const _fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function ukDateStr(d: Date = new Date()): string {
  const parts = _fmt.formatToParts(d);
  const p: Record<string, string> = {};
  for (const { type, value } of parts) p[type] = value;
  return `${p.year}-${p.month}-${p.day}`;
}

export function ukDayOfWeek(dateStr: string): number {
  const [y, mo, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[weekday] ?? d.getDay();
}
