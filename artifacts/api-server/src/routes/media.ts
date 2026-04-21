import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router = Router();
const storage = new ObjectStorageService();

function toServeUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("/objects/") || path.startsWith("objects/")) {
    return `/api/media/serve?path=${encodeURIComponent(path)}`;
  }
  return path;
}

function convertMap(map: Record<string, string> | undefined): Record<string, string> {
  if (!map || typeof map !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    const url = toServeUrl(v);
    if (url) out[k] = url;
  }
  return out;
}

/** Resolve a location UUID from slug or ID string */
async function resolveLocationId(raw: string | undefined): Promise<string | null> {
  if (!raw) return null;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_RE.test(raw)) return raw;
  const { data } = await supabaseAdmin.from("locations").select("id").eq("slug", raw).maybeSingle();
  return data?.id ? String(data.id) : null;
}

// GET /api/media/config — public config served to the website
// ?locationId=<uuid|slug>  optional — falls back to first active location
router.get("/media/config", async (req, res) => {
  try {
    const rawLoc = (req.query.locationId as string | undefined) ??
                   (req.headers["x-location-id"] as string | undefined);
    let locationId = await resolveLocationId(rawLoc);

    if (!locationId) {
      const { data: first } = await supabaseAdmin
        .from("locations")
        .select("id")
        .order("name")
        .limit(1)
        .maybeSingle();
      locationId = first?.id ? String(first.id) : null;
    }

    let data: Record<string, unknown> = {};
    if (locationId) {
      const { data: row } = await supabaseAdmin
        .from("portal_kv")
        .select("value")
        .eq("location_id", locationId)
        .eq("key", "dd_media")
        .maybeSingle();
      if (row?.value) data = row.value as Record<string, unknown>;
    }

    // Resolve new-format fields (dd_media structure)
    const heroVideo = toServeUrl((data?.heroVideo ?? data?.heroSrc) as string);
    const heroImage = toServeUrl(data?.heroImage as string);
    const aboutImage = toServeUrl((data?.aboutImage ?? data?.practitionerImage) as string);

    const rawGallery = Array.isArray(data?.galleryImages) ? (data.galleryImages as string[]) : [];
    const galleryImages = rawGallery.map(url => toServeUrl(url) ?? url).filter(Boolean);

    const rawVideos = Array.isArray(data?.resultsVideos) ? (data.resultsVideos as string[]) : [];
    const resultsVideos = rawVideos.map(url => toServeUrl(url) ?? url).filter(Boolean);

    // Transformations grid items
    interface TransformItem { key?: string; type?: string; src?: string; label?: string; category?: string; }
    const rawTransformations = Array.isArray(data?.transformations) ? (data.transformations as TransformItem[]) : [];
    const transformations = rawTransformations.map((item, i) => ({
      key: item.key ?? `t${i}`,
      type: item.type === "video" ? "video" : "image",
      src: toServeUrl(item.src) ?? item.src ?? "",
      label: item.label ?? "",
      category: item.category ?? "",
    }));

    // Legacy graduate slots (kept for backward compat)
    const defaultGraduates = [
      { slot: 1, name: "Sarah M.", course: "Foundation Anti-Wrinkle", src: "" },
      { slot: 2, name: "Jessica T.", course: "Advanced Dermal Filler", src: "" },
      { slot: 3, name: "Priya K.", course: "Pathway to Aesthetics", src: "" },
    ];
    const rawGraduates = Array.isArray(data?.graduates) && (data.graduates as unknown[]).length === 3
      ? (data.graduates as Array<Record<string, unknown>>)
      : defaultGraduates.map(g => ({ ...g }));
    const graduates = rawGraduates.map(g => ({
      slot: g.slot,
      name: g.name,
      course: g.course,
      src: toServeUrl(g.src as string) ?? "",
    }));

    return res.json({
      // New structure
      heroVideo,
      heroImage,
      aboutImage,
      galleryImages,
      resultsVideos,
      transformations,
      // Legacy fields (backward compat)
      practitionerImage: aboutImage,
      beforeAfter: convertMap(data?.baImages as Record<string, string>),
      baLabels: (data?.baLabels as Record<string, string>) ?? {},
      videos: convertMap(data?.vidSrcs as Record<string, string>),
      vidLabels: (data?.vidLabels as Record<string, string>) ?? {},
      graduates,
    });
  } catch (err) {
    console.error("GET /api/media/config", err);
    return res.json({
      heroVideo: null, heroImage: null, aboutImage: null,
      galleryImages: [], resultsVideos: [], transformations: [],
      practitionerImage: null, beforeAfter: {}, baLabels: {}, videos: {}, vidLabels: {}, graduates: [],
    });
  }
});

// POST /api/media/upload-url
router.post("/media/upload-url", async (req, res) => {
  const { contentType } = req.body as { contentType?: string };
  if (!contentType) {
    return res.status(400).json({ error: "contentType required" });
  }
  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    const rawGcsUrl = uploadURL.split("?")[0];
    const objectPath = storage.normalizeObjectEntityPath(rawGcsUrl);
    return res.json({ uploadURL, objectPath });
  } catch (err) {
    console.error("POST /api/media/upload-url", err);
    return res.status(500).json({ error: "Storage not configured" });
  }
});

// GET /api/media/serve
router.get("/media/serve", async (req, res) => {
  const objectPath = req.query.path as string | undefined;
  if (!objectPath) {
    return res.status(400).json({ error: "path query param required" });
  }
  try {
    const file = await storage.getObjectEntityFile(objectPath);
    const response = await storage.downloadObject(file, 86400);
    const headers = Object.fromEntries(response.headers.entries());
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v as string));
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      return res.status(404).json({ error: "not found" });
    }
    console.error("GET /api/media/serve", err);
    return res.status(500).json({ error: "storage error" });
  }
});

export default router;
