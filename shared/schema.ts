import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "club_admin", "super_admin"]);
export const eventStatusEnum = pgEnum("event_status", ["draft", "published"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed"]);
export const eventTypeEnum = pgEnum("event_type", ["workshop", "concert", "competition", "seminar", "sports", "cultural", "other"]);

// Users table - Required for Replit Auth with extended fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash", { length: 255 }),
  phone: varchar("phone", { length: 15 }),
  branch: varchar("branch", { length: 50 }),
  year: varchar("year", { length: 10 }),
  role: userRoleEnum("role").default("student").notNull(),
  clubId: varchar("club_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Clubs table
export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Club = typeof clubs.$inferSelect;
export type InsertClub = typeof clubs.$inferInsert;

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clubId: varchar("club_id").references(() => clubs.id),
  organizerId: varchar("organizer_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  bannerUrl: varchar("banner_url", { length: 500 }),
  venue: varchar("venue", { length: 200 }).notNull(),
  eventType: eventTypeEnum("event_type").default("other"),
  registrationOpens: timestamp("registration_opens").notNull(),
  registrationCloses: timestamp("registration_closes").notNull(),
  eventStarts: timestamp("event_starts").notNull(),
  eventEnds: timestamp("event_ends").notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  capacity: integer("capacity"),
  registeredCount: integer("registered_count").default(0).notNull(),
  status: eventStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_events_organizer").on(table.organizerId),
  index("idx_events_status_starts").on(table.status, table.eventStarts),
]);

export const insertEventSchema = createInsertSchema(events, {
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  venue: z.string().min(1).max(200),
  price: z.string().optional(),
  capacity: z.number().int().positive().optional(),
}).omit({
  id: true,
  registeredCount: true,
  createdAt: true,
  updatedAt: true,
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Event Registrations table
export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  ticketId: varchar("ticket_id", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  branch: varchar("branch", { length: 50 }).notNull(),
  year: varchar("year", { length: 10 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  paymentId: varchar("payment_id", { length: 100 }),
  qrCodeUrl: varchar("qr_code_url", { length: 500 }),
  registeredAt: timestamp("registered_at").defaultNow(),
}, (table) => [
  index("idx_regs_event").on(table.eventId),
  index("idx_regs_user").on(table.userId),
]);

export const insertRegistrationSchema = createInsertSchema(registrations, {
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  phone: z.string().min(10).max(15),
  branch: z.string().min(1).max(50),
  year: z.string().min(1).max(10),
}).omit({
  id: true,
  ticketId: true,
  qrCodeUrl: true,
  registeredAt: true,
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizedEvents: many(events),
  registrations: many(registrations),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  club: one(clubs, {
    fields: [events.clubId],
    references: [clubs.id],
  }),
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
}));
