import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysesRouter from "./analyses";
import reportsRouter from "./reports";
import lessonsRouter from "./lessons";
import chatRouter from "./chat";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysesRouter);
router.use(reportsRouter);
router.use(lessonsRouter);
router.use(chatRouter);
router.use(dashboardRouter);

export default router;
