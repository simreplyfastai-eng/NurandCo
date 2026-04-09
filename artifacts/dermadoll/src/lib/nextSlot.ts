const SCHED: Record<number, { oH: number; lH: number; lM: number; label: string }> = {
  2: { oH: 10, lH: 18, lM: 0, label: "from 10:00" },
  3: { oH: 10, lH: 18, lM: 0, label: "from 10:00" },
  4: { oH: 10, lH: 18, lM: 0, label: "from 10:00" },
  5: { oH: 9,  lH: 15, lM: 0, label: "from 09:00" },
  6: { oH: 9,  lH: 13, lM: 0, label: "from 09:00" },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getUKNow(): { h: number; m: number; dow: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const h = parseInt(get("hour"), 10);
  const m = parseInt(get("minute"), 10);
  const dow = DAY_NAMES.indexOf(get("weekday"));
  return { h, m, dow };
}

export function getNextAvailableSlot(): string {
  const { h, m, dow } = getUKNow();

  for (let offset = 0; offset < 7; offset++) {
    const d = (dow + offset) % 7;
    const sched = SCHED[d];
    if (!sched) continue;

    if (offset === 0) {
      const nowMins = h * 60 + m;
      const openMins = sched.oH * 60;
      const lastMins = sched.lH * 60 + sched.lM;

      if (nowMins < openMins) {
        return `Today ${sched.label}`;
      }

      const nextSlotMins = Math.ceil(nowMins / 30) * 30;
      if (nextSlotMins <= lastMins) {
        const sh = Math.floor(nextSlotMins / 60);
        const sm = nextSlotMins % 60;
        return `Today at ${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`;
      }
    } else {
      const prefix = offset === 1 ? "Tomorrow" : DAY_NAMES[d];
      return `${prefix} ${sched.label}`;
    }
  }

  return "Coming soon";
}
