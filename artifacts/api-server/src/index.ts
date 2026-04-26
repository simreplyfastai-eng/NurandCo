/*
 * ═══════════════════════════════════════════════════════
 * [CLIENT_NAME] — BOOKING SYSTEM API
 * ═══════════════════════════════════════════════════════
 *
 * Clinics: Hornchurch (Essex RM11) & Marylebone (London W1G)
 * Backend: Supabase (PostgreSQL) with location isolation
 *
 * Every booking, treatment, and availability rule
 * is filtered by location_id.
 * ═══════════════════════════════════════════════════════
 */

// All dates/times in UK timezone (BST/GMT)
process.env.TZ = "Europe/London";

import app from "./app";
import { logger } from "./lib/logger";
import { testSupabaseConnection } from "./lib/supabase";
import { seedTreatments } from "./lib/seed";
import { runAutoComplete } from "./routes/bookings";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const criticalVars = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SESSION_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
const pendingVars = ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET", "RESEND_API_KEY", "CRON_SECRET", "DATABASE_URL"];

for (const key of criticalVars) {
  if (!process.env[key]) logger.error(`CRITICAL: Missing required env var: ${key}`);
}
for (const key of pendingVars) {
  if (!process.env[key]) logger.warn(`PENDING: ${key} not yet set`);
}

(async () => {
  // Verify Supabase connection and seed initial data
  await testSupabaseConnection();
  await seedTreatments();

  // Optionally initialise old PostgreSQL tables (clients, kv store, etc.)
  try {
    const { ensureTables } = await import("@workspace/db");
    await ensureTables();
    logger.info("Legacy DB tables verified");
  } catch (err) {
    logger.warn({ err }, "Legacy DB not available — continuing with Supabase-only mode");
  }

  // Auto-complete past confirmed bookings every 15 minutes
  runAutoComplete().catch(console.error);
  setInterval(() => {
    runAutoComplete()
      .then((n) => { if (n > 0) logger.info(`Auto-completed ${n} booking(s)`); })
      .catch((err) => { logger.error({ err }, "Auto-complete failed"); });
  }, 15 * 60 * 1000);

  app.listen(port, (err) => {
    if (err) { logger.error({ err }, "Error listening on port"); process.exit(1); }
    logger.info({ port }, "[CLIENT_NAME] API server listening");
  });
})();
