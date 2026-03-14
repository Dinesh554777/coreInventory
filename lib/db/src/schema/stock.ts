import { pgTable, serial, integer, numeric, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { warehousesTable } from "./warehouses";

export const stockTable = pgTable("stock", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehousesTable.id),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  unique("stock_product_warehouse").on(t.productId, t.warehouseId),
]);

export const insertStockSchema = createInsertSchema(stockTable).omit({ id: true, updatedAt: true });
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stockTable.$inferSelect;
