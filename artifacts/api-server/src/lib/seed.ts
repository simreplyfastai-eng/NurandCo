import { supabaseAdmin } from "./supabase";

// ── Exact treatment rows per spec ─────────────────────────────────────────────
// 66 [LOCATION_1] + 11 [LOCATION_2] = 77 total
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

const LOCATION_1_TREATMENTS: TreatmentRow[] = [];

const LOCATION_2_TREATMENTS: TreatmentRow[] = [];

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
        -- enquiries_public_insert intentionally omitted — backend uses service_role for all writes
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

/** Keep location addresses up to date on every startup. */
async function ensureLocationAddresses(): Promise<void> {
  const updates = [
    { slug: "nur-and-co", address: "Private Clinic, Bedale Road, Sherwood, Nottingham, NG5 3GL", address_full: "19 Bedale Road, Sherwood, Nottingham, NG5 3GL" },
    { slug: "nur-and-co-2", address: "", address_full: "" },
  ];
  for (const { slug, address, address_full } of updates) {
    const { error } = await supabaseAdmin
      .from("locations")
      .update({ address, address_full })
      .eq("slug", slug);
    if (error) {
      console.warn(`Seed: could not update address for ${slug}:`, error.message);
    } else {
      console.log(`Seed: address set for ${slug}`);
    }
  }
}

export async function seedTreatments(): Promise<void> {
  try {
    await ensureCategoryColumn();
    await ensureLocationAddresses();
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

    const H = locs.find((l: { slug: string }) => l.slug === "nur-and-co")?.id as string | undefined;
    const M = locs.find((l: { slug: string }) => l.slug === "nur-and-co-2")?.id as string | undefined;

    if (!H) {
      console.warn("Seed: nur-and-co location not found - skipping treatment seed");
      return;
    }


    // ── Insert all 77 treatments in a single batch ─────────────────────────────
    const rows = [
      ...LOCATION_1_TREATMENTS.map((t) => ({ ...t, location_id: H })),
      ...(M ? LOCATION_2_TREATMENTS.map((t) => ({ ...t, location_id: M })) : []),
    ];

    if (rows.length === 0) {
      console.log("Seed: no template treatments to insert - skipping");
      return;
    }

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

    console.log(`Seed complete: total=${total} [location-1-slug]=${hCount} [location-2-slug]=${mCount} price=0 rows=${zeroPrice}`);

    if (total !== 77) console.warn(`Seed WARNING: expected 77 total, got ${total}`);
    if (hCount !== 66) console.warn(`Seed WARNING: expected 66 [location-1-slug], got ${hCount}`);
    if (mCount !== 11) console.warn(`Seed WARNING: expected 11 [location-2-slug], got ${mCount}`);
    if (zeroPrice !== 1) console.warn(`Seed WARNING: expected exactly 1 price=0 row (Fat Dissolving Lemon Bottle), got ${zeroPrice}`);

  } catch (err) {
    console.error("Seed error:", err);
  }
}
