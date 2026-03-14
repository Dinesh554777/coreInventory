import { db } from "@workspace/db";
import { stockTable, ledgerTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export async function adjustStock(
  productId: number,
  warehouseId: number,
  quantityChange: number,
  operationType: string,
  referenceId: number | null,
  referenceRef: string | null,
  notes?: string
): Promise<void> {
  const [existing] = await db
    .select()
    .from(stockTable)
    .where(and(eq(stockTable.productId, productId), eq(stockTable.warehouseId, warehouseId)));

  const currentQty = existing ? parseFloat(String(existing.quantity)) : 0;
  const newQty = currentQty + quantityChange;

  if (existing) {
    await db
      .update(stockTable)
      .set({ quantity: String(newQty) })
      .where(and(eq(stockTable.productId, productId), eq(stockTable.warehouseId, warehouseId)));
  } else {
    await db.insert(stockTable).values({
      productId,
      warehouseId,
      quantity: String(newQty),
    });
  }

  await db.insert(ledgerTable).values({
    productId,
    warehouseId,
    operationType,
    referenceId,
    referenceRef,
    quantityChange: String(quantityChange),
    quantityAfter: String(newQty),
    notes: notes ?? null,
  });
}

export async function getStockForProduct(productId: number) {
  return db
    .select()
    .from(stockTable)
    .where(eq(stockTable.productId, productId));
}
