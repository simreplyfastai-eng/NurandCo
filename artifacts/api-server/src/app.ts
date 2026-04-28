import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust the Replit proxy so each client's real IP is used for rate limiting
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins: (string | RegExp)[] = [
  "https://nurandcoaesthetics.co.uk",
  "https://aestheticsnottingham.co.uk",
  "https://www.nurandcoaesthetics.co.uk",
  "https://www.aestheticsnottingham.co.uk",
  "http://localhost:3000",
  "http://localhost:5173",
];
// Allow Replit dev-domain proxy in development so the portal preview works
if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.push(new RegExp(`https://${process.env.REPLIT_DEV_DOMAIN.replace(/\./g, "\\.")}.*`));
}
app.use(cors({ origin: allowedOrigins, credentials: true }));
// Raw body needed for Stripe webhook signature verification
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Rate limiting ───────────────────────────────────────────────────────────

// General catch-all: 200 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// Login: 10 attempts per 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

// Booking creation: 5 per hour
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking attempts. Please try again later." },
});

// Enquiries: 5 per minute per IP
const enquiryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many enquiry attempts. Please try again in a minute." },
});

// Payment intent: 5 per 10 min
const piLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a few minutes." },
});

// Form submission (health data): 10 per minute per IP
const formsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many form submissions. Please try again in a minute." },
});

app.use("/api", apiLimiter);
app.post("/api/auth/login", loginLimiter);
app.post("/api/auth/change-password", loginLimiter);
app.post("/api/bookings", bookingLimiter);
app.post("/api/enquiries", enquiryLimiter);
app.post("/api/stripe/create-payment-intent", piLimiter);
app.post("/api/forms/medical", formsLimiter);
app.post("/api/forms/consent", formsLimiter);

app.use("/api", router);

export default app;
