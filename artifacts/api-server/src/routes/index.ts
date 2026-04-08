import { Router, type IRouter } from "express";
import healthRouter from "./health";
import portalRouter from "./portal";
import bookingsRouter from "./bookings";
import financeRouter from "./finance";

const router: IRouter = Router();

router.use(healthRouter);
router.use(portalRouter);
router.use(bookingsRouter);
router.use(financeRouter);

export default router;
