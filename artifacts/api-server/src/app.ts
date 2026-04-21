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
  "https://starrbeautyy.co.uk",
  "https://www.starrbeautyy.co.uk",
];
// Allow Replit dev-domain proxy in development so the portal preview works
if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.push(new RegExp(`https://${process.env.REPLIT_DEV_DOMAIN.replace(/\./g, "\\.")}.*`));
}
app.use(cors({ origin: allowedOrigins, credentials: true }));
// Raw body needed for Stripe webhook signature verification
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for sensitive POST endpoints only
const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking attempts. Please try again in a few minutes." },
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in a few minutes." },
});

const enquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many enquiry attempts. Please try again in a few minutes." },
});

const piLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a few minutes." },
});

app.post("/api/bookings", bookingLimiter);
app.post("/api/auth/login", loginLimiter);
app.post("/api/enquiries", enquiryLimiter);
app.post("/api/stripe/create-payment-intent", piLimiter);

app.use("/api", router);

export default app;
