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

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(availabilityRouter);
router.use(mediaRouter);
router.use(cronRouter);
router.use(portalRouter);
router.use(bookingsRouter);
router.use(financeRouter);
router.use(clientsRouter);
router.use(enquiriesRouter);

export default router;
