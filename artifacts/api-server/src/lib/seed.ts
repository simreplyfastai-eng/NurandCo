import { supabaseAdmin } from "./supabase";

// ── Exact treatment rows per spec ─────────────────────────────────────────────
// 66 Hornchurch + 11 Marylebone = 77 total
// Only Fat Dissolving Lemon Bottle has price=0 (shown as POA on the site)
// deposit_type is 'fixed' for all rows

type TreatmentRow = {
  name: string;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  deposit_type: string;
  active: boolean;
  category: string;
};

const HORNCHURCH_TREATMENTS: TreatmentRow[] = [
  // Aesthetics — fillers (deposit £20)
  { name: "NATURALE LIPS 0.5ml",                                      duration_minutes: 45,  price: 135,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "NATURALE LIPS 0.8ml",                                      duration_minutes: 45,  price: 175,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "NATURALE LIPS 1.1ml",                                      duration_minutes: 45,  price: 185,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Smile Line Filler",                                        duration_minutes: 60,  price: 185,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "HD Sculpt Lips 0.8ml",                                     duration_minutes: 60,  price: 175,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "HD Sculpt Lips 1.1ml",                                     duration_minutes: 60,  price: 210,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Lips Russian Technique 0.5ml",                             duration_minutes: 40,  price: 135,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Lips Russian Technique 0.8ml",                             duration_minutes: 40,  price: 175,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Lips Russian Technique 1.1ml",                             duration_minutes: 40,  price: 185,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  // Aesthetics — price=0 = POA (the ONLY zero-price treatment)
  { name: "Fat Dissolving Lemon Bottle",                              duration_minutes: 30,  price: 0,    deposit_amount: 10, deposit_type: "fixed", active: true, category: "Aesthetics" },
  // Aesthetics — anti-wrinkle (deposit £10)
  { name: "Anti Wrinkle 1 Area",                                      duration_minutes: 30,  price: 180,  deposit_amount: 10, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Anti Wrinkle 2 Areas",                                     duration_minutes: 30,  price: 220,  deposit_amount: 10, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Anti Wrinkle 3 Areas",                                     duration_minutes: 30,  price: 300,  deposit_amount: 10, deposit_type: "fixed", active: true, category: "Aesthetics" },
  // Aesthetics — more fillers (deposit £20)
  { name: "Chin Filler 0.5ml",                                        duration_minutes: 30,  price: 130,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Chin Filler 1.1ml",                                        duration_minutes: 30,  price: 150,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Filler Dissolve Only",                                     duration_minutes: 60,  price: 200,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Lip Filler Dissolve and Refill Package",                   duration_minutes: 60,  price: 350,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Tear Trough Filler",                                       duration_minutes: 30,  price: 230,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Non-Surgical Rhinoplasty",                                 duration_minutes: 30,  price: 180,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Jaw Filler 1ml",                                           duration_minutes: 40,  price: 150,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Jaw Filler 2ml",                                           duration_minutes: 40,  price: 180,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Cheek Filler 1ml",                                         duration_minutes: 40,  price: 150,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Cheek Filler 2ml",                                         duration_minutes: 40,  price: 180,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Facial Contouring 3ml",                                    duration_minutes: 60,  price: 360,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Facial Contouring 4ml",                                    duration_minutes: 60,  price: 470,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Facial Contouring 5ml",                                    duration_minutes: 60,  price: 580,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Consultation",                                             duration_minutes: 30,  price: 30,   deposit_amount: 0,  deposit_type: "fixed", active: true, category: "Aesthetics" },
  // Lashes & Brows (deposit £10)
  { name: "Classic Full Set Lashes",                                  duration_minutes: 120, price: 55,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Mega Classics",                                            duration_minutes: 150, price: 55,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Hybrid Full Set",                                          duration_minutes: 120, price: 60,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Signature Wisp Me Hybrids",                                duration_minutes: 120, price: 70,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Russians Full Set",                                        duration_minutes: 120, price: 70,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Mega Volumes Full Set",                                    duration_minutes: 120, price: 75,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Classic Infill",                                           duration_minutes: 60,  price: 35,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Mega Classics Infill",                                     duration_minutes: 60,  price: 35,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Hybrid Infill",                                            duration_minutes: 60,  price: 40,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Signature Wisp Me Infill",                                 duration_minutes: 60,  price: 50,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Russians Infill",                                          duration_minutes: 60,  price: 50,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Mega Volumes Infill",                                      duration_minutes: 60,  price: 55,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Lash Removal",                                             duration_minutes: 30,  price: 15,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "LVL Lash Lift",                                            duration_minutes: 90,  price: 50,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Korean Lash Lift",                                         duration_minutes: 60,  price: 60,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Eyebrow Wax",                                              duration_minutes: 15,  price: 15,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  { name: "Eyebrow Wax and Tint",                                     duration_minutes: 20,  price: 25,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
  // Facials (deposit £10)
  { name: "Microneedling Facial",                                     duration_minutes: 60,  price: 55,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Facials" },
  { name: "STARRFACIAL Hydrofacial",                                  duration_minutes: 60,  price: 70,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Facials" },
  { name: "Luxe Microneedling Facial",                                duration_minutes: 30,  price: 75,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Facials" },
  // Nails (deposit £10)
  { name: "Plain Acrylic Set",                                        duration_minutes: 120, price: 50,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "French Tip Acrylic Set",                                   duration_minutes: 120, price: 55,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "Nail Art Acrylic Set",                                     duration_minutes: 120, price: 55,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "Plain BIAB Set",                                           duration_minutes: 120, price: 45,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "French Tip BIAB Set",                                      duration_minutes: 120, price: 50,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "Nail Art BIAB Set",                                        duration_minutes: 120, price: 55,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "Plain Hard Gel Set",                                       duration_minutes: 120, price: 53,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "French Tip Hard Gel Set",                                  duration_minutes: 120, price: 55,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "Nail Art Hard Gel Set",                                    duration_minutes: 120, price: 60,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "Toes",                                                     duration_minutes: 60,  price: 25,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  { name: "Russian Wet Pedicure",                                     duration_minutes: 100, price: 40,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Nails" },
  // SPMU (deposit £20)
  { name: "Lip Blush SPMU",                                           duration_minutes: 140, price: 120,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "SPMU" },
  { name: "Lip Blush SPMU Top Up",                                    duration_minutes: 90,  price: 95,   deposit_amount: 20, deposit_type: "fixed", active: true, category: "SPMU" },
  // Skin Boosters (deposit £20)
  { name: "Phlenyage 3 Sessions Full Face",                           duration_minutes: 90,  price: 800,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Skin Boosters" },
  { name: "Phlenyage 3 Sessions Eyes Only",                           duration_minutes: 90,  price: 450,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Skin Boosters" },
  { name: "Phlenyage Full Face Combo",                                duration_minutes: 90,  price: 1000, deposit_amount: 20, deposit_type: "fixed", active: true, category: "Skin Boosters" },
  { name: "Vitaran / Plinest / Nucleofill 3 Sessions Full Face",      duration_minutes: 90,  price: 570,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Skin Boosters" },
  { name: "Vitaran / Plinest / Nucleofill 3 Sessions Eyes Only",      duration_minutes: 90,  price: 380,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Skin Boosters" },
  { name: "Vitaran / Plinest / Nucleofill Full Face Combo",           duration_minutes: 90,  price: 850,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Skin Boosters" },
];

const MARYLEBONE_TREATMENTS: TreatmentRow[] = [
  // Aesthetics (deposit £20)
  { name: "NATURALE LIPS 0.5ml",                                      duration_minutes: 60,  price: 140,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "NATURALE LIPS 0.8ml",                                      duration_minutes: 60,  price: 185,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "NATURALE LIPS 1.1ml",                                      duration_minutes: 60,  price: 200,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "HD Sculpt Lips 0.8ml",                                     duration_minutes: 60,  price: 195,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "HD Sculpt Lips 1ml",                                       duration_minutes: 60,  price: 225,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Facial Contouring 3ml",                                    duration_minutes: 60,  price: 395,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Facial Contouring 4ml",                                    duration_minutes: 60,  price: 495,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Facial Contouring 5ml",                                    duration_minutes: 60,  price: 595,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Non-Surgical Rhinoplasty with 2 Week Top Up",              duration_minutes: 60,  price: 250,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  { name: "Tear Trough Filler",                                       duration_minutes: 60,  price: 250,  deposit_amount: 20, deposit_type: "fixed", active: true, category: "Aesthetics" },
  // Lashes & Brows (deposit £10)
  { name: "Eyelash Extensions",                                       duration_minutes: 60,  price: 75,   deposit_amount: 10, deposit_type: "fixed", active: true, category: "Lashes & Brows" },
];

/** Ensure the category column exists on the treatments table. */
async function ensureCategoryColumn(): Promise<void> {
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

/** Attempt to create the unique index for client deduplication. */
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
    // exec_sql RPC may not exist — app-level dedup handles it
  }
}

/** Create enquiries table if it doesn't exist. */
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
    await client.rpc("exec_sql", { query: `NOTIFY pgrst, 'reload schema';` }).catch(() => {});
    console.log("Seed: enquiries table created/verified");
  } catch (err) {
    console.warn("Seed: exec_sql RPC not available — enquiries table must be created manually", err);
  }
}

export async function seedTreatments(): Promise<void> {
  try {
    await ensureCategoryColumn();
    ensureClientUniqueIndex().catch(() => {});
    ensureEnquiriesTable().catch(() => {});

    // ── SEED PROTECTION: only seed when table is completely empty ──────────────
    const { count, error: countErr } = await supabaseAdmin
      .from("treatments")
      .select("*", { count: "exact", head: true });

    if (countErr) {
      console.error("Seed: could not check treatment count", countErr.message);
      return;
    }

    if (count !== 0) {
      console.log(`Seed: treatments table has ${count} rows — skipping seed (delete all treatments to re-seed)`);
      return;
    }

    // ── Resolve location IDs ───────────────────────────────────────────────────
    const { data: locs, error: locErr } = await supabaseAdmin
      .from("locations")
      .select("id, slug");

    if (locErr || !locs?.length) {
      console.error("Seed: could not load locations", locErr?.message);
      return;
    }

    const H = locs.find((l: { slug: string }) => l.slug === "hornchurch")?.id as string | undefined;
    const M = locs.find((l: { slug: string }) => l.slug === "marylebone")?.id as string | undefined;

    if (!H || !M) {
      console.error(`Seed: missing location IDs — hornchurch=${H} marylebone=${M}`);
      return;
    }

    // ── Insert all 77 treatments in a single batch ─────────────────────────────
    const rows = [
      ...HORNCHURCH_TREATMENTS.map((t) => ({ ...t, location_id: H })),
      ...MARYLEBONE_TREATMENTS.map((t) => ({ ...t, location_id: M })),
    ];

    const { error: insertErr } = await supabaseAdmin.from("treatments").insert(rows);

    if (insertErr) {
      console.error("Seed: insert failed", insertErr.message);
      return;
    }

    // ── Verify counts after seed ───────────────────────────────────────────────
    const { count: total } = await supabaseAdmin
      .from("treatments")
      .select("*", { count: "exact", head: true });

    const { count: hCount } = await supabaseAdmin
      .from("treatments")
      .select("*", { count: "exact", head: true })
      .eq("location_id", H);

    const { count: mCount } = await supabaseAdmin
      .from("treatments")
      .select("*", { count: "exact", head: true })
      .eq("location_id", M);

    const { count: zeroPrice } = await supabaseAdmin
      .from("treatments")
      .select("*", { count: "exact", head: true })
      .eq("price", 0);

    console.log(`Seed complete: total=${total} hornchurch=${hCount} marylebone=${mCount} price=0 rows=${zeroPrice}`);

    if (total !== 77) console.warn(`Seed WARNING: expected 77 total, got ${total}`);
    if (hCount !== 66) console.warn(`Seed WARNING: expected 66 hornchurch, got ${hCount}`);
    if (mCount !== 11) console.warn(`Seed WARNING: expected 11 marylebone, got ${mCount}`);
    if (zeroPrice !== 1) console.warn(`Seed WARNING: expected exactly 1 price=0 row (Fat Dissolving Lemon Bottle), got ${zeroPrice}`);

  } catch (err) {
    console.error("Seed error:", err);
  }
}
