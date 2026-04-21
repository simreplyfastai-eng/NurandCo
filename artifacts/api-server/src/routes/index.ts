import { Router, type IRouter } from "express";
import healthRouter from "./health";
import portalRouter from "./portal";
import bookingsRouter from "./bookings";
import financeRouter from "./finance";
import clientsRouter from "./clients";
import authRouter from "./auth";
import availabilityRouter from "./availability";
import mediaRouter from "./media";
import cronRouter from "./cron";
import enquiriesRouter from "./enquiries";
import stripeRouter from "./stripe";
import locationsRouter from "./locations";
import treatmentsRouter from "./treatments-route";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(locationsRouter);
router.use(treatmentsRouter);
router.use(availabilityRouter);
router.use(mediaRouter);
router.use(cronRouter);
router.use(portalRouter);
router.use(bookingsRouter);
router.use(financeRouter);
router.use(clientsRouter);
router.use(enquiriesRouter);
router.use(stripeRouter);

export default router;
