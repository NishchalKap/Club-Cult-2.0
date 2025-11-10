import {
  users,
  events,
  registrations,
  clubs,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type Registration,
  type InsertRegistration,
  type Club,
  type InsertClub,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Event operations
  getAllEvents(): Promise<Event[]>;
  getPublishedEvents(filters?: { eventType?: string; isPaid?: boolean }): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByOrganizer(organizerId: string): Promise<Event[]>;
  createEvent(event: InsertEvent & { organizerId: string }): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  incrementEventRegistrations(eventId: string): Promise<void>;

  // Registration operations
  createRegistration(registration: InsertRegistration & { eventId: string; userId: string }): Promise<Registration>;
  getUserRegistrations(userId: string): Promise<Array<Registration & { event: Event }>>;
  getEventRegistrations(eventId: string): Promise<Array<Registration>>;
  getUserEventRegistration(userId: string, eventId: string): Promise<Registration | null>;
  getAllRegistrations(): Promise<Array<Registration & { event: Event }>>;

  // Analytics operations
  getAdminStats(userId: string): Promise<{
    totalEvents: number;
    publishedEvents: number;
    totalRegistrations: number;
    totalRevenue: string;
    upcomingEvents: number;
    recentRegistrations: Array<Registration & { event: Event }>;
  }>;

  // Club operations (future use)
  getClub(id: string): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Event operations
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getPublishedEvents(filters?: { eventType?: string; isPaid?: boolean }): Promise<Event[]> {
    let query = db.select().from(events).where(eq(events.status, "published"));
    
    const conditions = [eq(events.status, "published")];
    
    if (filters?.eventType) {
      conditions.push(eq(events.eventType, filters.eventType as any));
    }
    
    if (filters?.isPaid !== undefined) {
      conditions.push(eq(events.isPaid, filters.isPaid));
    }

    if (conditions.length > 0) {
      const result = await db.select().from(events).where(and(...conditions)).orderBy(desc(events.eventStarts));
      return result;
    }

    return await db.select().from(events).where(eq(events.status, "published")).orderBy(desc(events.eventStarts));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.organizerId, organizerId)).orderBy(desc(events.createdAt));
  }

  async createEvent(eventData: InsertEvent & { organizerId: string }): Promise<Event> {
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  }

  async updateEvent(id: string, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: string): Promise<boolean> {
    // First delete all registrations for this event
    await db.delete(registrations).where(eq(registrations.eventId, id));
    // Then delete the event
    const result = await db.delete(events).where(eq(events.id, id));
    return true;
  }

  async incrementEventRegistrations(eventId: string): Promise<void> {
    await db
      .update(events)
      .set({
        registeredCount: sql`${events.registeredCount} + 1`,
      })
      .where(eq(events.id, eventId));
  }

  // Registration operations
  async createRegistration(registrationData: InsertRegistration & { eventId: string; userId: string }): Promise<Registration> {
    const ticketId = `TICKET-${randomUUID().split('-')[0].toUpperCase()}`;
    
    const [registration] = await db
      .insert(registrations)
      .values({
        ...registrationData,
        ticketId,
        paymentStatus: "completed", // Default to completed for free events
      })
      .returning();
    
    // Increment event registration count
    await this.incrementEventRegistrations(registrationData.eventId);
    
    return registration;
  }

  async getUserRegistrations(userId: string): Promise<Array<Registration & { event: Event }>> {
    const results = await db
      .select()
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(eq(registrations.userId, userId))
      .orderBy(desc(registrations.registeredAt));

    return results.map((r) => ({
      ...r.registrations,
      event: r.events,
    }));
  }

  async getEventRegistrations(eventId: string): Promise<Array<Registration>> {
    return await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, eventId))
      .orderBy(desc(registrations.registeredAt));
  }

  async getUserEventRegistration(userId: string, eventId: string): Promise<Registration | null> {
    const [registration] = await db
      .select()
      .from(registrations)
      .where(and(eq(registrations.userId, userId), eq(registrations.eventId, eventId)));
    
    return registration || null;
  }

  async getAllRegistrations(): Promise<Array<Registration & { event: Event }>> {
    const results = await db
      .select()
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .orderBy(desc(registrations.registeredAt))
      .limit(50);

    return results.map((r) => ({
      ...r.registrations,
      event: r.events,
    }));
  }

  // Analytics operations
  async getAdminStats(userId: string): Promise<{
    totalEvents: number;
    publishedEvents: number;
    totalRegistrations: number;
    totalRevenue: string;
    upcomingEvents: number;
    recentRegistrations: Array<Registration & { event: Event }>;
  }> {
    // Get all events by this organizer
    const userEvents = await this.getEventsByOrganizer(userId);
    
    const totalEvents = userEvents.length;
    const publishedEvents = userEvents.filter(e => e.status === "published").length;
    const upcomingEvents = userEvents.filter(e => new Date(e.eventStarts) > new Date()).length;

    // Calculate total registrations and revenue
    let totalRegistrations = 0;
    let totalRevenue = 0;

    for (const event of userEvents) {
      totalRegistrations += event.registeredCount;
      if (event.isPaid && event.price) {
        totalRevenue += parseFloat(event.price) * event.registeredCount;
      }
    }

    // Get recent registrations
    const recentRegs = await db
      .select()
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(eq(events.organizerId, userId))
      .orderBy(desc(registrations.registeredAt))
      .limit(10);

    const recentRegistrations = recentRegs.map((r) => ({
      ...r.registrations,
      event: r.events,
    }));

    return {
      totalEvents,
      publishedEvents,
      totalRegistrations,
      totalRevenue: totalRevenue.toFixed(2),
      upcomingEvents,
      recentRegistrations,
    };
  }

  // Club operations
  async getClub(id: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club;
  }

  async createClub(clubData: InsertClub): Promise<Club> {
    const [club] = await db.insert(clubs).values(clubData).returning();
    return club;
  }
}

export const storage = new DatabaseStorage();
