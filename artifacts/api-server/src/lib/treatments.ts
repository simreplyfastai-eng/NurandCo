export const TREATMENT_DURATIONS: Record<string, number> = {
  "Botox 1 Area": 15,
  "Botox 2 Areas": 15,
  "Botox 3 Areas": 15,
  "Botox 4 Areas": 15,
  "Masseter Botox": 15,
  "Nefertiti Lift Botox (Neck)": 30,
  "Chin Botox (Mentalis Muscle)": 30,
  "Nose Slimming Botox": 30,
  "Gummy Smile / Lip Flip Botox": 30,
  "Hyperhidrosis (Underarm) Botox": 30,
  "Botox Topup": 15,
  "0.5ml Lip Filler": 30,
  "0.7ml Lip Filler": 45,
  "1.1ml Lip Filler": 45,
  "1.1ml Nasal Labials": 30,
  "1.1ml Cheek Filler": 30,
  "1.5ml Cheek Filler": 45,
  "2.2ml Cheek Filler": 45,
  "1.1ml Chin Filler": 45,
  "2.2ml Jawline Filler": 60,
  "Liquid Rhinoplasty": 45,
  "Teartrough Filler": 45,
  "2.2ml Facial Contouring": 45,
  "3.3ml Facial Contouring": 60,
  "4.4ml Facial Contouring": 60,
  "Glass Skin Facial": 60,
  "Glass Skin Facial + Microneedling": 60,
  "1x Skin Booster": 30,
  "3x Lumi Pro Skin Booster": 30,
  "Plenhyage XL Strong": 30,
  "Plenhyage XL Strong 2 Treatments": 30,
  "Vitarin I - Eye Polynucleotide": 30,
  "Vitarin I - Eye Polynucleotide x2": 30,
  "B12 Injection": 15,
  "Lemon Bottle Small Area": 30,
  "Lemon Bottle Large Area": 30,
  "Botox 3 Areas + 1.1ml Dermal Filler": 45,
  "Botox 3 Areas + 1.1ml Lips + Lumi Pro": 60,
  "Botox 3 Areas + 1x Lumi Pro Skin Booster": 45,
  "Botox 3 Areas + 1x Plenhyage XL": 45,
  "Botox 3 Areas + Vitarin I Eye": 45,
};

export function getTreatmentDuration(treatmentName: string): number {
  return TREATMENT_DURATIONS[treatmentName] ?? 30;
}

/** Returns minutes since midnight for a "HH:MM" string */
export function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Returns "HH:MM" for a given number of minutes since midnight */
export function minsToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Given a list of booked slots (time + durationMinutes), compute all 30-minute
 * slot strings that are blocked for a given working window.
 */
export function computeBlockedSlots(
  bookings: { time: string; durationMinutes: number }[],
): Set<string> {
  const blocked = new Set<string>();
  for (const { time, durationMinutes } of bookings) {
    if (!time) continue;
    const startMins = timeToMins(time);
    const blockedUntil = startMins + durationMinutes + 15;
    for (let m = startMins; m < blockedUntil; m += 30) {
      blocked.add(minsToTime(m));
    }
  }
  return blocked;
}

/**
 * Check whether a proposed booking (time + duration) overlaps with any existing booking.
 * Returns true if there is a conflict.
 */
export function hasConflict(
  proposedTime: string,
  proposedDuration: number,
  existingBookings: { time: string; durationMinutes: number; status?: string }[],
): boolean {
  if (!proposedTime) return false;
  const proposedStart = timeToMins(proposedTime);
  const proposedEnd = proposedStart + proposedDuration + 15;

  for (const b of existingBookings) {
    if (!b.time) continue;
    if (b.status === "Cancelled") continue;
    const existStart = timeToMins(b.time);
    const existEnd = existStart + (b.durationMinutes ?? 30) + 15;
    if (proposedStart < existEnd && proposedEnd > existStart) return true;
  }
  return false;
}
