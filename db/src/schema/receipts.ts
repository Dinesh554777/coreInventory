import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { warehousesTable } from "./warehouses";
import { productsTable } from "./products";

export const receiptsTable = pgTable("receipts", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  warehouseId: integer("warehouse_id").notNull().references(() => warehousesTable.id),
  supplier: text("supplier"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
});

export const receiptLinesTable = pgTable("receipt_lines", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id").notNull().references(() => receiptsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
});

export const insertReceiptSchema = createInsertSchema(receiptsTable).omit({ id: true, createdAt: true });
export const insertReceiptLineSchema = createInsertSchema(receiptLinesTable).omit({ id: true });
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receiptsTable.$inferSelect;
export type ReceiptLine = typeof receiptLinesTable.$inferSelect;
