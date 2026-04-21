import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

if (!supabaseUrl) console.error("CRITICAL: SUPABASE_URL is not set");
if (!supabaseServiceKey) console.error("CRITICAL: SUPABASE_SERVICE_KEY is not set");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function testSupabaseConnection(): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin.from("locations").select("id, name, slug");
    if (error) {
      console.error("Supabase connection failed:", error.message);
    } else {
      console.log("Supabase connected:", data?.map((l) => l.slug).join(", "));
    }
  } catch (err) {
    console.error("Supabase connection error:", err);
  }
}

/** Resolves a location UUID from either a slug or a UUID string */
export async function resolveLocationId(slugOrId: string): Promise<string | null> {
  if (!slugOrId) return null;
  const isUuid = /^[0-9a-f-]{36}$/i.test(slugOrId);
  if (isUuid) return slugOrId;
  const { data } = await supabaseAdmin
    .from("locations")
    .select("id")
    .eq("slug", slugOrId.toLowerCase())
    .single();
  return data?.id ?? null;
}
