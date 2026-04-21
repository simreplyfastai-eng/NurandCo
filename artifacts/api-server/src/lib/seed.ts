import { supabaseAdmin } from "./supabase";

const TREATMENTS = [
  { name: "Russian Lips 0.5ml", duration_minutes: 60, price: 85, deposit_amount: 43 },
  { name: "Russian Lips 1ml", duration_minutes: 60, price: 95, deposit_amount: 48 },
  { name: "Signature Lips 0.5ml", duration_minutes: 75, price: 75, deposit_amount: 38 },
  { name: "Signature Lips 1ml", duration_minutes: 75, price: 95, deposit_amount: 48 },
  { name: "Cheek Filler 1ml", duration_minutes: 60, price: 90, deposit_amount: 45 },
  { name: "Cheek Filler 2ml", duration_minutes: 60, price: 165, deposit_amount: 83 },
  { name: "Chin Filler 1ml", duration_minutes: 60, price: 90, deposit_amount: 45 },
  { name: "Jawline Filler 1ml", duration_minutes: 65, price: 90, deposit_amount: 45 },
  { name: "Jawline Filler 2ml", duration_minutes: 65, price: 165, deposit_amount: 83 },
  { name: "Liquid Rhinoplasty 1ml", duration_minutes: 60, price: 90, deposit_amount: 45 },
  { name: "Smile Lines Filler 1ml", duration_minutes: 75, price: 90, deposit_amount: 45 },
  { name: "Facial Balancing Tweak 2ml", duration_minutes: 90, price: 155, deposit_amount: 78 },
  { name: "Facial Balancing Refine 3ml", duration_minutes: 90, price: 175, deposit_amount: 88 },
  { name: "Facial Balancing Balance 4ml", duration_minutes: 105, price: 195, deposit_amount: 98 },
  { name: "Facial Balancing Harmonise 5ml", duration_minutes: 105, price: 215, deposit_amount: 108 },
  { name: "Anti-Wrinkle 1 Area", duration_minutes: 45, price: 145, deposit_amount: 73 },
  { name: "Anti-Wrinkle 2 Areas", duration_minutes: 45, price: 180, deposit_amount: 90 },
  { name: "Anti-Wrinkle 3 Areas", duration_minutes: 45, price: 190, deposit_amount: 95 },
  { name: "Filler Dissolving 1 Area", duration_minutes: 90, price: 90, deposit_amount: 45 },
  { name: "Lip Dissolve + 1ml Refill", duration_minutes: 90, price: 170, deposit_amount: 85 },
  { name: "Polynucleotides Full Face", duration_minutes: 60, price: 110, deposit_amount: 55 },
  { name: "Polynucleotides Under Eye", duration_minutes: 60, price: 100, deposit_amount: 50 },
  { name: "In-Person Consultation", duration_minutes: 30, price: 25, deposit_amount: 25 },
  { name: "Virtual Consultation", duration_minutes: 15, price: 0, deposit_amount: 0 },
];

export async function seedTreatments(): Promise<void> {
  try {
    const { data: locations, error: locErr } = await supabaseAdmin
      .from("locations")
      .select("id, slug");
    if (locErr || !locations?.length) {
      console.error("Seed: could not load locations", locErr?.message);
      return;
    }

    for (const loc of locations) {
      const { count } = await supabaseAdmin
        .from("treatments")
        .select("id", { count: "exact", head: true })
        .eq("location_id", loc.id);

      if ((count ?? 0) > 0) {
        console.log(`Seed: treatments already exist for ${loc.slug} (${count}) — skipping`);
        continue;
      }

      const rows = TREATMENTS.map((t) => ({ ...t, location_id: loc.id, active: true }));
      const { error } = await supabaseAdmin.from("treatments").insert(rows);
      if (error) {
        console.error(`Seed: failed to insert treatments for ${loc.slug}`, error.message);
      } else {
        console.log(`Seed: inserted ${rows.length} treatments for ${loc.slug}`);
      }
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
}
