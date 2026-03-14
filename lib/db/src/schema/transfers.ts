import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { warehousesTable } from "./warehouses";
import { productsTable } from "./products";

export const transfersTable = pgTable("transfers", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  fromWarehouseId: integer("from_warehouse_id").notNull().references(() => warehousesTable.id),
  toWarehouseId: integer("to_warehouse_id").notNull().references(() => warehousesTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
});

export const transferLinesTable = pgTable("transfer_lines", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").notNull().references(() => transfersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
});

export const insertTransferSchema = createInsertSchema(transfersTable).omit({ id: true, createdAt: true });
export const insertTransferLineSchema = createInsertSchema(transferLinesTable).omit({ id: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfersTable.$inferSelect;
export type TransferLine = typeof transferLinesTable.$inferSelect;
