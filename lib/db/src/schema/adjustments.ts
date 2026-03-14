import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { warehousesTable } from "./warehouses";
import { productsTable } from "./products";

export const adjustmentsTable = pgTable("adjustments", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  warehouseId: integer("warehouse_id").notNull().references(() => warehousesTable.id),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
});

export const adjustmentLinesTable = pgTable("adjustment_lines", {
  id: serial("id").primaryKey(),
  adjustmentId: integer("adjustment_id").notNull().references(() => adjustmentsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  currentQty: numeric("current_qty", { precision: 12, scale: 4 }).notNull().default("0"),
  countedQty: numeric("counted_qty", { precision: 12, scale: 4 }).notNull(),
});

export const insertAdjustmentSchema = createInsertSchema(adjustmentsTable).omit({ id: true, createdAt: true });
export const insertAdjustmentLineSchema = createInsertSchema(adjustmentLinesTable).omit({ id: true });
export type InsertAdjustment = z.infer<typeof insertAdjustmentSchema>;
export type Adjustment = typeof adjustmentsTable.$inferSelect;
export type AdjustmentLine = typeof adjustmentLinesTable.$inferSelect;
