import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysesRouter from "./analyses";
import reportsRouter from "./reports";
import lessonsRouter from "./lessons";
import translateRouter from "./translate";
import chatRouter from "./chat";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysesRouter);
router.use(reportsRouter);
router.use(lessonsRouter);
router.use(translateRouter);
router.use(chatRouter);
router.use(dashboardRouter);
router.use(authRouter);

export default router;
