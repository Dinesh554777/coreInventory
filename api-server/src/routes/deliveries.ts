import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { deliveriesTable, deliveryLinesTable, productsTable, warehousesTable, stockTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateDeliveryBody,
  GetDeliveryParams,
  UpdateDeliveryParams,
  UpdateDeliveryBody,
  ValidateDeliveryParams,
  ListDeliveriesQueryParams,
} from "@workspace/api-zod";
import { adjustStock } from "../lib/stock-ops";
import { generateRef } from "../lib/refgen";

const router: IRouter = Router();

async function buildDelivery(delivery: typeof deliveriesTable.$inferSelect) {
  const warehouse = (await db.select().from(warehousesTable).where(eq(warehousesTable.id, delivery.warehouseId)))[0];
  const lines = await db
    .select({
      id: deliveryLinesTable.id,
      productId: deliveryLinesTable.productId,
      productName: productsTable.name,
      productSku: productsTable.sku,
      quantity: deliveryLinesTable.quantity,
      unit: productsTable.unit,
    })
    .from(deliveryLinesTable)
    .innerJoin(productsTable, eq(deliveryLinesTable.productId, productsTable.id))
    .where(eq(deliveryLinesTable.deliveryId, delivery.id));

  return {
    id: delivery.id,
    reference: delivery.reference,
    status: delivery.status,
    warehouseId: delivery.warehouseId,
    warehouseName: warehouse?.name ?? "Unknown",
    customer: delivery.customer ?? null,
    notes: delivery.notes ?? null,
    lines: lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.productName,
      productSku: l.productSku,
      quantity: parseFloat(String(l.quantity)),
      unit: l.unit,
    })),
    createdAt: delivery.createdAt,
    validatedAt: delivery.validatedAt ?? null,
  };
}

router.get("/deliveries", async (req, res): Promise<void> => {
  const q = ListDeliveriesQueryParams.safeParse(req.query);
  let deliveries = await db.select().from(deliveriesTable).orderBy(deliveriesTable.createdAt);
  if (q.success) {
    if (q.data.status) deliveries = deliveries.filter((d) => d.status === q.data.status);
    if (q.data.warehouseId) deliveries = deliveries.filter((d) => d.warehouseId === q.data.warehouseId);
  }
  const result = await Promise.all(deliveries.map(buildDelivery));
  res.json(result);
});

router.post("/deliveries", async (req, res): Promise<void> => {
  const parsed = CreateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { warehouseId, customer, notes, lines } = parsed.data;
  const reference = generateRef("DEL");

  const [delivery] = await db.insert(deliveriesTable).values({
    reference,
    warehouseId,
    customer: customer ?? null,
    notes: notes ?? null,
    status: "draft",
  }).returning();

  if (lines && lines.length > 0) {
    await db.insert(deliveryLinesTable).values(
      lines.map((l) => ({ deliveryId: delivery.id, productId: l.productId, quantity: String(l.quantity) }))
    );
  }

  res.status(201).json(await buildDelivery(delivery));
});

router.get("/deliveries/:id", async (req, res): Promise<void> => {
  const params = GetDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }
  res.json(await buildDelivery(delivery));
});

router.patch("/deliveries/:id", async (req, res): Promise<void> => {
  const params = UpdateDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }
  if (delivery.status === "done") {
    res.status(400).json({ error: "Cannot edit a validated delivery" });
    return;
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.customer !== undefined) update.customer = parsed.data.customer;
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;
  const [updated] = await db.update(deliveriesTable).set(update).where(eq(deliveriesTable.id, params.data.id)).returning();

  if (parsed.data.lines) {
    await db.delete(deliveryLinesTable).where(eq(deliveryLinesTable.deliveryId, params.data.id));
    if (parsed.data.lines.length > 0) {
      await db.insert(deliveryLinesTable).values(
        parsed.data.lines.map((l) => ({ deliveryId: params.data.id, productId: l.productId, quantity: String(l.quantity) }))
      );
    }
  }

  res.json(await buildDelivery(updated));
});

router.post("/deliveries/:id/validate", async (req, res): Promise<void> => {
  const params = ValidateDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }
  if (delivery.status === "done") {
    res.status(400).json({ error: "Delivery already validated" });
    return;
  }

  const lines = await db.select().from(deliveryLinesTable).where(eq(deliveryLinesTable.deliveryId, delivery.id));
  if (lines.length === 0) {
    res.status(400).json({ error: "Delivery has no lines" });
    return;
  }

  for (const line of lines) {
    const [stockRow] = await db
      .select()
      .from(stockTable)
      .where(and(eq(stockTable.productId, line.productId), eq(stockTable.warehouseId, delivery.warehouseId)));
    const available = stockRow ? parseFloat(String(stockRow.quantity)) : 0;
    const needed = parseFloat(String(line.quantity));
    if (available < needed) {
      res.status(400).json({ error: `Insufficient stock for product ID ${line.productId}` });
      return;
    }
  }

  for (const line of lines) {
    await adjustStock(
      line.productId,
      delivery.warehouseId,
      -parseFloat(String(line.quantity)),
      "delivery",
      delivery.id,
      delivery.reference,
      `Delivery ${delivery.reference}`
    );
  }

  const [updated] = await db
    .update(deliveriesTable)
    .set({ status: "done", validatedAt: new Date() })
    .where(eq(deliveriesTable.id, delivery.id))
    .returning();

  res.json(await buildDelivery(updated));
});

export default router;
