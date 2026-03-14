import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { warehousesTable } from "./warehouses";
import { productsTable } from "./products";

export const deliveriesTable = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  warehouseId: integer("warehouse_id").notNull().references(() => warehousesTable.id),
  customer: text("customer"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
});

export const deliveryLinesTable = pgTable("delivery_lines", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").notNull().references(() => deliveriesTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
});

export const insertDeliverySchema = createInsertSchema(deliveriesTable).omit({ id: true, createdAt: true });
export const insertDeliveryLineSchema = createInsertSchema(deliveryLinesTable).omit({ id: true });
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveriesTable.$inferSelect;
export type DeliveryLine = typeof deliveryLinesTable.$inferSelect;
