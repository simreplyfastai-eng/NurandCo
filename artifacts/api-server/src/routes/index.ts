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
import adminRouter from "./admin";
import formsRouter from "./forms";
import calendarRouter from "./calendar";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(locationsRouter);
router.use(treatmentsRouter);
router.use(availabilityRouter);
router.use(adminRouter);
router.use(mediaRouter);
router.use(cronRouter);
router.use(portalRouter);
router.use(bookingsRouter);
router.use(financeRouter);
router.use(clientsRouter);
router.use(enquiriesRouter);
router.use(stripeRouter);
router.use(formsRouter);
router.use(calendarRouter);

export default router;
