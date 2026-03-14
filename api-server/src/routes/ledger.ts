import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ledgerTable, productsTable, warehousesTable } from "@workspace/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { ListLedgerQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ledger", async (req, res): Promise<void> => {
  const q = ListLedgerQueryParams.safeParse(req.query);
  const page = (q.success && q.data.page) ? q.data.page : 1;
  const pageSize = (q.success && q.data.pageSize) ? q.data.pageSize : 50;

  const rows = await db
    .select({
      id: ledgerTable.id,
      productId: ledgerTable.productId,
      productName: productsTable.name,
      productSku: productsTable.sku,
      warehouseId: ledgerTable.warehouseId,
      warehouseName: warehousesTable.name,
      operationType: ledgerTable.operationType,
      referenceId: ledgerTable.referenceId,
      referenceRef: ledgerTable.referenceRef,
      quantityChange: ledgerTable.quantityChange,
      quantityAfter: ledgerTable.quantityAfter,
      notes: ledgerTable.notes,
      createdAt: ledgerTable.createdAt,
    })
    .from(ledgerTable)
    .innerJoin(productsTable, eq(ledgerTable.productId, productsTable.id))
    .innerJoin(warehousesTable, eq(ledgerTable.warehouseId, warehousesTable.id))
    .orderBy(desc(ledgerTable.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  let filtered = rows;
  if (q.success) {
    if (q.data.productId) filtered = filtered.filter((r) => r.productId === q.data.productId);
    if (q.data.warehouseId) filtered = filtered.filter((r) => r.warehouseId === q.data.warehouseId);
    if (q.data.operationType) filtered = filtered.filter((r) => r.operationType === q.data.operationType);
  }

  const totalRows = await db.select({ count: count() }).from(ledgerTable);
  const total = totalRows[0]?.count ?? 0;

  res.json({
    entries: filtered.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.productName,
      productSku: r.productSku,
      warehouseId: r.warehouseId,
      warehouseName: r.warehouseName,
      operationType: r.operationType,
      referenceId: r.referenceId ?? null,
      referenceRef: r.referenceRef ?? null,
      quantityChange: parseFloat(String(r.quantityChange)),
      quantityAfter: parseFloat(String(r.quantityAfter)),
      notes: r.notes ?? null,
      createdAt: r.createdAt,
    })),
    total: Number(total),
    page,
    pageSize,
  });
});

export default router;
