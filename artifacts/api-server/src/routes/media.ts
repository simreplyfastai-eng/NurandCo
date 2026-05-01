import { Router } from "express";
import multer from "multer";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../lib/auth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router = Router();
const storage = new ObjectStorageService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Ensure the Supabase storage bucket exists on startup
async function ensureMediaBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === "media");
    if (!exists) {
      await supabaseAdmin.storage.createBucket("media", {
        public: true,
        allowedMimeTypes: [
          "image/jpeg", "image/jpg", "image/png", "image/webp",
          "video/mp4", "video/mov", "video/quicktime", "video/webm",
        ],
        fileSizeLimit: 52428800,
      });
      console.log("Created Supabase storage bucket: media");
    }
  } catch (err) {
    console.warn("ensureMediaBucket warning:", err);
  }
}
ensureMediaBucket();

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

// POST /api/media/config — save one field (or all) to portal_kv dd_media
router.post("/media/config", async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const locationId = (req.headers["x-location-id"] as string | undefined) ?? null;
    if (!locationId) return res.status(400).json({ error: "X-Location-Id header required" });

    const { field, value } = req.body as { field?: string; value?: unknown };
    if (!field) return res.status(400).json({ error: "field required" });

    // Read current dd_media row for this location (id + value in one query)
    const { data: kvRow } = await supabaseAdmin
      .from("portal_kv")
      .select("id, value")
      .eq("location_id", locationId)
      .eq("key", "dd_media")
      .maybeSingle();

    const currentValue = (kvRow?.value as Record<string, unknown>) ?? {};
    const updated: Record<string, unknown> =
      field === "all" && value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : { ...currentValue, [field]: value };

    const now = new Date().toISOString();
    let writeError;
    if (kvRow?.id) {
      const { error } = await supabaseAdmin
        .from("portal_kv")
        .update({ value: updated, updated_at: now })
        .eq("id", String(kvRow.id));
      writeError = error;
    } else {
      const { error } = await supabaseAdmin
        .from("portal_kv")
        .insert({ location_id: locationId, key: "dd_media", value: updated, updated_at: now });
      writeError = error;
    }

    if (writeError) {
      const wMsg = (writeError && (writeError.message || JSON.stringify(writeError))) || "unknown";
      console.error("POST /api/media/config write error:", wMsg);
      try { require("fs").appendFileSync("/tmp/upload-debug.log", `[${new Date().toISOString()}] SAVE WRITE FAIL field=${field} loc=${locationId}: ${wMsg}\n\n`); } catch(_){}
      return res.status(500).json({ error: "Failed to save media config", detail: wMsg });
    }

    return res.json({ success: true, field });
  } catch (err: any) {
    const eMsg = (err && (err.message || err.toString())) || "unknown";
    const eStack = (err && err.stack) || "";
    console.error("POST /api/media/config FAILED:", eMsg, eStack);
    try { require("fs").appendFileSync("/tmp/upload-debug.log", `[${new Date().toISOString()}] SAVE CATCH FAIL: ${eMsg}\n${eStack}\n\n`); } catch(_){}
    return res.status(500).json({ error: "Failed to save media config", detail: eMsg });
  }
});

// POST /api/media/upload — multipart file upload to Supabase Storage
router.post("/media/upload", upload.single("file"), async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: "No file provided" });

    const type = (req.body?.type as string) || "gallery";
    const ext = (file.originalname.split(".").pop() || "bin").toLowerCase();
    const filename = `${type}-${Date.now()}.${ext}`;
    const path = `nur-and-co/${type}/${filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("media")
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      try { require("fs").appendFileSync("/tmp/upload-debug.log", `[${new Date().toISOString()}] STORAGE FAIL path=${path}: ${uploadError.message}\n\n`); } catch(_){}
      return res.status(500).json({ error: "Storage upload failed", detail: uploadError.message, path });
    }

    const { data: urlData } = supabaseAdmin.storage.from("media").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Optionally persist the URL into portal_kv dd_media when a field is provided
    const field = (req.body?.field as string | undefined) || null;
    const locationId = (req.headers["x-location-id"] as string | undefined) ?? null;
    if (field && locationId) {
      try {
        const { data: current } = await supabaseAdmin
          .from("portal_kv")
          .select("value")
          .eq("location_id", locationId)
          .eq("key", "dd_media")
          .maybeSingle();
        const existing = (current?.value as Record<string, unknown>) ?? {};
        let updated: Record<string, unknown>;
        if (field === "galleryImages" || field === "resultsVideos") {
          const arr = Array.isArray(existing[field]) ? [...(existing[field] as string[])] : [];
          arr.push(publicUrl);
          updated = { ...existing, [field]: arr };
        } else {
          updated = { ...existing, [field]: publicUrl };
        }
        await supabaseAdmin.from("portal_kv").upsert(
          { location_id: locationId, key: "dd_media", value: updated, updated_at: new Date().toISOString() },
          { onConflict: "location_id,key" }
        );
      } catch (kvErr) {
        console.warn("POST /api/media/upload: portal_kv update failed", kvErr);
      }
    }

    try { require("fs").appendFileSync("/tmp/upload-debug.log", `[${new Date().toISOString()}] UPLOAD OK path=${path} url=${publicUrl}\n\n`); } catch(_){}
    return res.json({ success: true, url: publicUrl, path });
  } catch (err: any) {
    const errMsg = (err && (err.message || err.toString())) || "unknown";
    const errStack = (err && err.stack) || "";
    console.error("POST /api/media/upload FAILED:", errMsg, errStack);
    try { require("fs").appendFileSync("/tmp/upload-debug.log", `[${new Date().toISOString()}] UPLOAD FAILED: ${errMsg}\n${errStack}\n\n`); } catch(_){}
    return res.status(500).json({ error: "Upload failed", detail: errMsg });
  }
});

// POST /api/media/upload-url (legacy — kept for any existing callers)
router.post("/media/upload-url", async (req, res) => {
  if (!requireAuth(req, res)) return;
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

// GET /api/media/serve — streams legacy object-storage files with full range-request support
router.get("/media/serve", async (req, res) => {
  const objectPath = req.query.path as string | undefined;
  if (!objectPath) {
    return res.status(400).json({ error: "path query param required" });
  }
  try {
    const file = await storage.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    const contentType = (metadata.contentType as string) || "application/octet-stream";
    const fileSize = Number(metadata.size || 0);

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000");

    const rangeHeader = req.headers.range;
    if (rangeHeader && fileSize) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? Math.min(parseInt(parts[1], 10), fileSize - 1) : fileSize - 1;

      if (start >= fileSize || start > end) {
        res.setHeader("Content-Range", `bytes */${fileSize}`);
        return res.status(416).end();
      }

      const chunkSize = end - start + 1;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Content-Length", chunkSize);
      res.status(206);

      const stream = file.createReadStream({ start, end });
      stream.on("error", (err) => {
        console.error("GET /api/media/serve stream error", err);
        if (!res.headersSent) res.status(500).end();
      });
      return stream.pipe(res);
    }

    if (fileSize) res.setHeader("Content-Length", fileSize);
    const stream = file.createReadStream();
    stream.on("error", (err) => {
      console.error("GET /api/media/serve stream error", err);
      if (!res.headersSent) res.status(500).end();
    });
    return stream.pipe(res);
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      return res.status(404).json({ error: "not found" });
    }
    console.error("GET /api/media/serve", err);
    return res.status(500).json({ error: "storage error" });
  }
});

export default router;
