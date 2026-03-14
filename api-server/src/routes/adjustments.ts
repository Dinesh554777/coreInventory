import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { adjustmentsTable, adjustmentLinesTable, productsTable, warehousesTable, stockTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateAdjustmentBody,
  GetAdjustmentParams,
  ValidateAdjustmentParams,
  ListAdjustmentsQueryParams,
} from "@workspace/api-zod";
import { adjustStock } from "../lib/stock-ops";
import { generateRef } from "../lib/refgen";

const router: IRouter = Router();

async function buildAdjustment(adjustment: typeof adjustmentsTable.$inferSelect) {
  const warehouse = (await db.select().from(warehousesTable).where(eq(warehousesTable.id, adjustment.warehouseId)))[0];
  const lines = await db
    .select({
      id: adjustmentLinesTable.id,
      productId: adjustmentLinesTable.productId,
      productName: productsTable.name,
      productSku: productsTable.sku,
      currentQty: adjustmentLinesTable.currentQty,
      countedQty: adjustmentLinesTable.countedQty,
      unit: productsTable.unit,
    })
    .from(adjustmentLinesTable)
    .innerJoin(productsTable, eq(adjustmentLinesTable.productId, productsTable.id))
    .where(eq(adjustmentLinesTable.adjustmentId, adjustment.id));

  return {
    id: adjustment.id,
    reference: adjustment.reference,
    status: adjustment.status,
    warehouseId: adjustment.warehouseId,
    warehouseName: warehouse?.name ?? "Unknown",
    reason: adjustment.reason ?? null,
    notes: adjustment.notes ?? null,
    lines: lines.map((l) => {
      const current = parseFloat(String(l.currentQty));
      const counted = parseFloat(String(l.countedQty));
      return {
        id: l.id,
        productId: l.productId,
        productName: l.productName,
        productSku: l.productSku,
        currentQty: current,
        countedQty: counted,
        difference: counted - current,
        unit: l.unit,
      };
    }),
    createdAt: adjustment.createdAt,
    validatedAt: adjustment.validatedAt ?? null,
  };
}

router.get("/adjustments", async (req, res): Promise<void> => {
  const q = ListAdjustmentsQueryParams.safeParse(req.query);
  let adjustments = await db.select().from(adjustmentsTable).orderBy(adjustmentsTable.createdAt);
  if (q.success && q.data.warehouseId) {
    adjustments = adjustments.filter((a) => a.warehouseId === q.data.warehouseId);
  }
  const result = await Promise.all(adjustments.map(buildAdjustment));
  res.json(result);
});

router.post("/adjustments", async (req, res): Promise<void> => {
  const parsed = CreateAdjustmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { warehouseId, reason, notes, lines } = parsed.data;
  const reference = generateRef("ADJ");

  const [adjustment] = await db.insert(adjustmentsTable).values({
    reference,
    warehouseId,
    reason: reason ?? null,
    notes: notes ?? null,
    status: "draft",
  }).returning();

  if (lines && lines.length > 0) {
    for (const line of lines) {
      const [stockRow] = await db
        .select()
        .from(stockTable)
        .where(and(eq(stockTable.productId, line.productId), eq(stockTable.warehouseId, warehouseId)));
      const currentQty = stockRow ? parseFloat(String(stockRow.quantity)) : 0;

      await db.insert(adjustmentLinesTable).values({
        adjustmentId: adjustment.id,
        productId: line.productId,
        currentQty: String(currentQty),
        countedQty: String(line.countedQty),
      });
    }
  }

  res.status(201).json(await buildAdjustment(adjustment));
});

router.get("/adjustments/:id", async (req, res): Promise<void> => {
  const params = GetAdjustmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [adjustment] = await db.select().from(adjustmentsTable).where(eq(adjustmentsTable.id, params.data.id));
  if (!adjustment) {
    res.status(404).json({ error: "Adjustment not found" });
    return;
  }
  res.json(await buildAdjustment(adjustment));
});

router.post("/adjustments/:id/validate", async (req, res): Promise<void> => {
  const params = ValidateAdjustmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [adjustment] = await db.select().from(adjustmentsTable).where(eq(adjustmentsTable.id, params.data.id));
  if (!adjustment) {
    res.status(404).json({ error: "Adjustment not found" });
    return;
  }
  if (adjustment.status === "done") {
    res.status(400).json({ error: "Adjustment already validated" });
    return;
  }

  const lines = await db.select().from(adjustmentLinesTable).where(eq(adjustmentLinesTable.adjustmentId, adjustment.id));
  if (lines.length === 0) {
    res.status(400).json({ error: "Adjustment has no lines" });
    return;
  }

  for (const line of lines) {
    const current = parseFloat(String(line.currentQty));
    const counted = parseFloat(String(line.countedQty));
    const diff = counted - current;
    if (diff !== 0) {
      await adjustStock(
        line.productId,
        adjustment.warehouseId,
        diff,
        "adjustment",
        adjustment.id,
        adjustment.reference,
        `Adjustment ${adjustment.reference} (${adjustment.reason ?? ""})`
      );
    }
  }

  const [updated] = await db
    .update(adjustmentsTable)
    .set({ status: "done", validatedAt: new Date() })
    .where(eq(adjustmentsTable.id, adjustment.id))
    .returning();

  res.json(await buildAdjustment(updated));
});

export default router;
