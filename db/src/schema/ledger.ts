import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { warehousesTable } from "./warehouses";

export const ledgerTable = pgTable("ledger", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  warehouseId: integer("warehouse_id").notNull().references(() => warehousesTable.id),
  operationType: text("operation_type").notNull(),
  referenceId: integer("reference_id"),
  referenceRef: text("reference_ref"),
  quantityChange: numeric("quantity_change", { precision: 12, scale: 4 }).notNull(),
  quantityAfter: numeric("quantity_after", { precision: 12, scale: 4 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLedgerSchema = createInsertSchema(ledgerTable).omit({ id: true, createdAt: true });
export type InsertLedger = z.infer<typeof insertLedgerSchema>;
export type LedgerEntry = typeof ledgerTable.$inferSelect;
