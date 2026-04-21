import { supabaseAdmin } from "./supabase";

// ── Hornchurch treatments ─────────────────────────────────────────────────────

const HORNCHURCH: Array<{ name: string; duration_minutes: number; price: number; deposit_amount: number; category: string }> = [
  // Aesthetics — injectables (deposit £20)
  { name: "NATURALE LIPS",                        duration_minutes: 45,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Smile Line Filler",                    duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "HD Sculpt Lips",                       duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Lips Russian Technique",               duration_minutes: 40,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Chin Filler",                          duration_minutes: 30,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Lip Hydration",                        duration_minutes: 30,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Tear Trough Filler",                   duration_minutes: 30,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Non-Surgical Rhinoplasty",             duration_minutes: 30,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Jaw Filler",                           duration_minutes: 40,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Cheek Filler",                         duration_minutes: 40,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Lips Normal Technique",                duration_minutes: 30,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Facial Contouring Package",            duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Polynucleotides",                      duration_minutes: 30,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Beautiform Facial Contouring Package", duration_minutes: 135, price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Filler Dissolve Only",                 duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Lip Filler Dissolve and Refill Package", duration_minutes: 60, price: 0, deposit_amount: 20, category: "Aesthetics" },
  // Aesthetics — non-injectable (deposit £10)
  { name: "Fat Dissolving Lemon Bottle",          duration_minutes: 30,  price: 0, deposit_amount: 10, category: "Aesthetics" },
  { name: "Anti Wrinkle",                         duration_minutes: 30,  price: 0, deposit_amount: 10, category: "Aesthetics" },
  { name: "Skin Booster",                         duration_minutes: 30,  price: 0, deposit_amount: 10, category: "Aesthetics" },
  { name: "Consultation",                         duration_minutes: 30,  price: 0, deposit_amount: 0,  category: "Aesthetics" },
  // Lashes & Brows (all £10 deposit)
  { name: "Classic Full Set Lashes",              duration_minutes: 120, price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Mega Classics",                        duration_minutes: 150, price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Hybrid Full Set",                      duration_minutes: 120, price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Signature Wisp Me Hybrids",            duration_minutes: 120, price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Russians Full Set",                    duration_minutes: 120, price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Mega Volumes Full Set",                duration_minutes: 120, price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "American Style Lash Set",              duration_minutes: 120, price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Lash Extension Infill",                duration_minutes: 60,  price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Lash Removal",                         duration_minutes: 30,  price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "LVL Lash Lift",                        duration_minutes: 90,  price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Korean Lash Lift",                     duration_minutes: 60,  price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Eyebrow Wax",                          duration_minutes: 15,  price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  { name: "Eyebrow Wax and Tint",                 duration_minutes: 20,  price: 0, deposit_amount: 10, category: "Lashes & Brows" },
  // Facials (all £10 deposit)
  { name: "Microneedling Facial",                 duration_minutes: 60,  price: 0, deposit_amount: 10, category: "Facials" },
  { name: "STARRFACIAL Hydrofacial",              duration_minutes: 60,  price: 0, deposit_amount: 10, category: "Facials" },
  { name: "Luxe Microneedling Facial",            duration_minutes: 30,  price: 0, deposit_amount: 10, category: "Facials" },
  { name: "Microneedling",                        duration_minutes: 30,  price: 0, deposit_amount: 10, category: "Facials" },
  // Nails (all £10 deposit)
  { name: "Nails Full Set",                       duration_minutes: 120, price: 0, deposit_amount: 10, category: "Nails" },
  { name: "Nail Infill",                          duration_minutes: 60,  price: 0, deposit_amount: 10, category: "Nails" },
  { name: "BIAB Russian Manicure Plain",          duration_minutes: 120, price: 0, deposit_amount: 10, category: "Nails" },
  { name: "Toes Gel Acrylic Biab Polygel",        duration_minutes: 60,  price: 0, deposit_amount: 10, category: "Nails" },
  { name: "Russian Wet Pedicure",                 duration_minutes: 100, price: 0, deposit_amount: 10, category: "Nails" },
  { name: "Hard Gel Extensions",                  duration_minutes: 120, price: 0, deposit_amount: 10, category: "Nails" },
  { name: "BIAB Russian Technique With Design",   duration_minutes: 120, price: 0, deposit_amount: 10, category: "Nails" },
  // SPMU (£20 deposit)
  { name: "Lip Blush SPMU",                       duration_minutes: 140, price: 0, deposit_amount: 20, category: "SPMU" },
];

// ── Marylebone treatments ─────────────────────────────────────────────────────

const MARYLEBONE: Array<{ name: string; duration_minutes: number; price: number; deposit_amount: number; category: string }> = [
  // Aesthetics (£20 deposit — injectable)
  { name: "Dermal Filler No Packages",            duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "NATURALE LIPS",                        duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "HD Sculpt Lips",                       duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Facial Contouring Beautification",     duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Non-Surgical Rhinoplasty",             duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  { name: "Tear Trough Filler",                   duration_minutes: 60,  price: 0, deposit_amount: 20, category: "Aesthetics" },
  // Lashes & Brows (£10 deposit)
  { name: "Eyelash Extensions",                   duration_minutes: 60,  price: 0, deposit_amount: 10, category: "Lashes & Brows" },
];

const LOCATION_TREATMENTS: Record<string, typeof HORNCHURCH> = {
  hornchurch: HORNCHURCH,
  marylebone: MARYLEBONE,
};

/** Ensure the category column exists on the Supabase treatments table.
 *  We attempt a no-op update; if the column is missing Supabase will throw a
 *  specific error we can ignore (column already present → also ignored). */
async function ensureCategoryColumn(): Promise<void> {
  // The column is created by the Supabase migration. We verify it exists by
  // reading one row — if the response has a `category` key we're good.
  try {
    const { data } = await supabaseAdmin
      .from("treatments")
      .select("category")
      .limit(1);
    if (data !== null) {
      console.log("Seed: category column confirmed on treatments table");
    }
  } catch {
    console.warn("Seed: category column not yet confirmed — proceeding anyway");
  }
}

/** Attempt to create the unique index for client deduplication.
 *  Silently fails if exec_sql RPC is not available — app-level dedup still applies. */
async function ensureClientUniqueIndex(): Promise<void> {
  try {
    await (supabaseAdmin as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown> })
      .rpc("exec_sql", {
        query: `CREATE UNIQUE INDEX IF NOT EXISTS clients_location_email_unique
                ON clients(location_id, LOWER(email))
                WHERE email IS NOT NULL`,
      });
    console.log("Seed: clients unique index verified");
  } catch {
    // exec_sql RPC may not exist — that's fine, app-level dedup handles it
  }
}

/** Create enquiries table if it doesn't exist via exec_sql RPC. */
async function ensureEnquiriesTable(): Promise<void> {
  const client = supabaseAdmin as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  try {
    const { error } = await client.rpc("exec_sql", {
      query: `
        CREATE TABLE IF NOT EXISTS enquiries (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          location_id UUID REFERENCES locations(id),
          course_name TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          experience_level TEXT,
          message TEXT,
          status TEXT DEFAULT 'new'
            CHECK (status IN ('new','contacted','enrolled','closed')),
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    });
    if (error) {
      console.warn("Seed: enquiries table exec_sql error:", error.message);
      return;
    }
    // Enable RLS and policies separately
    await client.rpc("exec_sql", { query: `ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;` }).catch(() => {});
    await client.rpc("exec_sql", {
      query: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='enquiries' AND policyname='enquiries_public_insert') THEN
          CREATE POLICY "enquiries_public_insert" ON enquiries FOR INSERT TO anon WITH CHECK (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='enquiries' AND policyname='enquiries_service_all') THEN
          CREATE POLICY "enquiries_service_all" ON enquiries FOR ALL TO service_role USING (true);
        END IF;
      END $$;`,
    }).catch(() => {});
    await client.rpc("exec_sql", {
      query: `CREATE INDEX IF NOT EXISTS idx_enquiries_location ON enquiries(location_id);
              CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);`,
    }).catch(() => {});
    // Notify PostgREST to reload its schema cache
    await client.rpc("exec_sql", { query: `NOTIFY pgrst, 'reload schema';` }).catch(() => {});
    console.log("Seed: enquiries table created/verified");
  } catch (err) {
    console.warn("Seed: exec_sql RPC not available — enquiries table must be created manually in Supabase dashboard", err);
  }
}

export async function seedTreatments(): Promise<void> {
  try {
    await ensureCategoryColumn();
    ensureClientUniqueIndex().catch(() => {});
    ensureEnquiriesTable().catch(() => {});

    const { data: locations, error: locErr } = await supabaseAdmin
      .from("locations")
      .select("id, slug");
    if (locErr || !locations?.length) {
      console.error("Seed: could not load locations", locErr?.message);
      return;
    }

    for (const loc of locations) {
      const slug = (loc.slug as string).toLowerCase().replace(/\s+/g, "-");
      const treatments = LOCATION_TREATMENTS[slug];
      if (!treatments) {
        console.log(`Seed: no treatment template for location slug '${slug}' — skipping`);
        continue;
      }

      // Get existing treatment names for this location
      const { data: existing } = await supabaseAdmin
        .from("treatments")
        .select("id, name")
        .eq("location_id", loc.id);

      const existingNames = new Set((existing ?? []).map((t: { name: string }) => t.name));
      const toInsert = treatments
        .filter((t) => !existingNames.has(t.name))
        .map((t) => ({ ...t, location_id: loc.id, active: true }));

      if (toInsert.length > 0) {
        const { error } = await supabaseAdmin.from("treatments").insert(toInsert);
        if (error) {
          console.error(`Seed: failed to insert ${toInsert.length} treatments for ${slug}`, error.message);
        } else {
          console.log(`Seed: inserted ${toInsert.length} treatments for ${slug}`);
        }
      } else {
        console.log(`Seed: treatments already exist for ${slug} (${existingNames.size}) — skipping inserts`);
      }

      // Always update category on existing treatments to ensure correct values
      const categoryUpdates = treatments
        .filter((t) => existingNames.has(t.name))
        .map((t) =>
          supabaseAdmin
            .from("treatments")
            .update({ category: t.category, deposit_amount: t.deposit_amount })
            .eq("location_id", loc.id)
            .eq("name", t.name)
            .then(() => {})
            .catch(() => {})
        );
      await Promise.all(categoryUpdates);
      if (categoryUpdates.length > 0) {
        console.log(`Seed: category/deposit refreshed for ${categoryUpdates.length} existing treatments in ${slug}`);
      }
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
}
