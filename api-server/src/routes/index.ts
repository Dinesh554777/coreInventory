import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import warehousesRouter from "./warehouses";
import productsRouter from "./products";
import receiptsRouter from "./receipts";
import deliveriesRouter from "./deliveries";
import transfersRouter from "./transfers";
import adjustmentsRouter from "./adjustments";
import ledgerRouter from "./ledger";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(warehousesRouter);
router.use(productsRouter);
router.use(receiptsRouter);
router.use(deliveriesRouter);
router.use(transfersRouter);
router.use(adjustmentsRouter);
router.use(ledgerRouter);
router.use(dashboardRouter);

export default router;
