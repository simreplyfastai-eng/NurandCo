import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

// GET /api/locations — returns all clinic locations (public)
router.get("/locations", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("locations")
      .select("id, slug, name, address")
      .order("name");
    if (error) throw error;
    return res.json(data ?? []);
  } catch (err) {
    console.error("GET /api/locations", err);
    return res.status(500).json({ error: "Failed to load locations" });
  }
});

export default router;
