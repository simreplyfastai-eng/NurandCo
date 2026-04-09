import app from "./app";
import { logger } from "./lib/logger";
import { ensureTables } from "@workspace/db";
import { cleanupGhostBookings } from "./routes/bookings";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ── Startup environment variable checks ──────────────────────────────────────
const criticalVars = ["DATABASE_URL", "SESSION_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
const pendingVars = ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET", "RESEND_API_KEY", "CRON_SECRET"];

for (const key of criticalVars) {
  if (!process.env[key]) {
    logger.error(`CRITICAL: Missing required environment variable: ${key}`);
  }
}
for (const key of pendingVars) {
  if (!process.env[key]) {
    logger.warn(`PENDING: ${key} not yet set — will be added before go-live`);
  }
}

(async () => {
  try {
    await ensureTables();
    logger.info("Database tables verified");
  } catch (err) {
    logger.error({ err }, "Failed to ensure database tables — continuing anyway");
  }

  // Run ghost booking cleanup on startup then every 30 minutes
  cleanupGhostBookings().catch(console.error);
  setInterval(() => {
    cleanupGhostBookings()
      .then((n) => { if (n > 0) logger.info(`Ghost booking cleanup removed ${n} stale slot(s)`); })
      .catch((err) => { logger.error({ err }, "Ghost cleanup failed"); });
  }, 30 * 60 * 1000);

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
})();
