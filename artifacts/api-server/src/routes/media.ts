import { Router } from "express";
import { pool } from "@workspace/db";
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

// GET /api/media/config — public config served to the website
router.get("/media/config", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM portal_kv WHERE key = 'dd_media'"
    );
    const data: Record<string, unknown> =
      result.rows.length > 0 ? (result.rows[0].value as Record<string, unknown>) : {};

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
      practitionerImage: toServeUrl(data?.practitionerImage as string),
      heroVideo: toServeUrl(data?.heroSrc as string),
      beforeAfter: convertMap(data?.baImages as Record<string, string>),
      baLabels: (data?.baLabels as Record<string, string>) ?? {},
      videos: convertMap(data?.vidSrcs as Record<string, string>),
      vidLabels: (data?.vidLabels as Record<string, string>) ?? {},
      graduates,
    });
  } catch (err) {
    console.error("GET /api/media/config", err);
    return res.json({ practitionerImage: null, heroVideo: null, beforeAfter: {}, baLabels: {}, videos: {}, vidLabels: {}, graduates: [] });
  }
});

// POST /api/media/upload-url
// Returns { uploadURL: string, objectPath: string }
// The client PUTs the binary directly to uploadURL (presigned), then stores the objectPath reference
router.post("/media/upload-url", async (req, res) => {
  const { contentType } = req.body as { contentType?: string };
  if (!contentType) {
    return res.status(400).json({ error: "contentType required" });
  }
  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    // Strip query string to get the raw GCS URL for normalisation
    const rawGcsUrl = uploadURL.split("?")[0];
    const objectPath = storage.normalizeObjectEntityPath(rawGcsUrl);
    return res.json({ uploadURL, objectPath });
  } catch (err) {
    console.error("POST /api/media/upload-url", err);
    return res.status(500).json({ error: "Storage not configured" });
  }
});

// GET /api/media/serve  — proxy a stored object back to the browser
// ?path=<url-encoded objectPath>  e.g. /objects/uploads/<uuid>
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
