import { Router, type IRouter } from "express";
import healthRouter from "./health";
import raniaRouter from "./rania";
import adminRouter from "./admin";
import cqapRouter from "./cqap";

const router: IRouter = Router();

router.use(healthRouter);
router.use(raniaRouter);
router.use(adminRouter);
router.use(cqapRouter);

export default router;
