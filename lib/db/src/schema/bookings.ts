import { pgTable, text, integer, boolean, bigint } from "drizzle-orm/pg-core";

export const bookingsTable = pgTable("bookings", {
  id: text("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").default(""),
  treatment: text("treatment").notNull(),
  category: text("category").default(""),
  price: integer("price").default(0),
  deposit: integer("deposit").default(0),
  depositPaid: boolean("deposit_paid").default(true),
  balancePaid: boolean("balance_paid").default(false),
  date: text("date").notNull(),
  time: text("time").default(""),
  status: text("status").default("Pending"),
  paymentMethod: text("payment_method").default("Stripe"),
  stripePaymentId: text("stripe_payment_id"),
  notes: text("notes").default(""),
  createdAt: bigint("created_at", { mode: "number" }).default(0),
  source: text("source").default("Portal"),
});

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;
