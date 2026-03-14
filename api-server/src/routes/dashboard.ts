import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  productsTable, stockTable, receiptsTable, deliveriesTable,
  transfersTable, adjustmentsTable
} from "@workspace/db";
import { eq, and, lte, count, sum, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/kpis", async (_req, res): Promise<void> => {
  const [totalProductsRow] = await db.select({ count: count() }).from(productsTable);
  const totalProducts = Number(totalProductsRow?.count ?? 0);

  const stockRows = await db.select({ quantity: stockTable.quantity }).from(stockTable);
  const totalStock = stockRows.reduce((sum, r) => sum + parseFloat(String(r.quantity)), 0);

  const allProducts = await db.select().from(productsTable);
  const allStock = await db.select().from(stockTable);

  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const product of allProducts) {
    const productStock = allStock
      .filter((s) => s.productId === product.id)
      .reduce((sum, s) => sum + parseFloat(String(s.quantity)), 0);
    if (productStock === 0) outOfStockCount++;
    else if (productStock <= product.reorderPoint) lowStockCount++;
  }

  const [pendingReceiptsRow] = await db
    .select({ count: count() })
    .from(receiptsTable)
    .where(eq(receiptsTable.status, "draft"));
  const pendingReceipts = Number(pendingReceiptsRow?.count ?? 0);

  const [pendingDeliveriesRow] = await db
    .select({ count: count() })
    .from(deliveriesTable)
    .where(eq(deliveriesTable.status, "draft"));
  const pendingDeliveries = Number(pendingDeliveriesRow?.count ?? 0);

  const [pendingTransfersRow] = await db
    .select({ count: count() })
    .from(transfersTable)
    .where(eq(transfersTable.status, "draft"));
  const pendingTransfers = Number(pendingTransfersRow?.count ?? 0);

  const [pendingAdjustmentsRow] = await db
    .select({ count: count() })
    .from(adjustmentsTable)
    .where(eq(adjustmentsTable.status, "draft"));
  const pendingAdjustments = Number(pendingAdjustmentsRow?.count ?? 0);

  res.json({
    totalProducts,
    totalStock,
    lowStockCount,
    outOfStockCount,
    pendingReceipts,
    pendingDeliveries,
    pendingTransfers,
    pendingAdjustments,
  });
});

router.get("/dashboard/low-stock", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);
  const allStock = await db.select().from(stockTable);

  const alerts = products
    .map((p) => {
      const total = allStock
        .filter((s) => s.productId === p.id)
        .reduce((sum, s) => sum + parseFloat(String(s.quantity)), 0);
      return { product: p, total };
    })
    .filter(({ product, total }) => total <= product.reorderPoint)
    .map(({ product, total }) => ({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      reorderPoint: product.reorderPoint,
      totalStock: total,
      unit: product.unit,
    }));

  res.json(alerts);
});

export default router;
