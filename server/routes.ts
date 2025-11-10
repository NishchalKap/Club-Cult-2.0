import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { insertEventSchema, insertRegistrationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public event routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getPublishedEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Check if user is registered for an event
  app.get('/api/events/:id/my-registration', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;
      const registration = await storage.getUserEventRegistration(userId, eventId);
      res.json(registration);
    } catch (error) {
      console.error("Error checking registration:", error);
      res.status(500).json({ message: "Failed to check registration" });
    }
  });

  // Register for event
  app.post('/api/events/:id/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;

      // Check if event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if registration is open
      const now = new Date();
      if (now < new Date(event.registrationOpens)) {
        return res.status(400).json({ message: "Registration has not opened yet" });
      }
      if (now > new Date(event.registrationCloses)) {
        return res.status(400).json({ message: "Registration has closed" });
      }

      // Check if event is full
      if (event.capacity && event.registeredCount >= event.capacity) {
        return res.status(400).json({ message: "Event is sold out" });
      }

      // Check if already registered
      const existingRegistration = await storage.getUserEventRegistration(userId, eventId);
      if (existingRegistration) {
        return res.status(400).json({ message: "You are already registered for this event" });
      }

      // Validate request body
      const validatedData = insertRegistrationSchema.parse(req.body);

      // Create registration
      const registration = await storage.createRegistration({
        ...validatedData,
        eventId,
        userId,
        paymentStatus: event.isPaid ? "pending" : "completed",
      });

      res.json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      console.error("Error creating registration:", error);
      res.status(500).json({ message: "Failed to register for event" });
    }
  });

  // Get user's tickets
  app.get('/api/users/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tickets = await storage.getUserRegistrations(userId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Admin routes - Get dashboard stats
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getAdminStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin routes - Get all events by organizer
  app.get('/api/admin/events', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getEventsByOrganizer(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching admin events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Admin routes - Create event
  app.post('/api/admin/events', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validatedData = insertEventSchema.parse(req.body);

      // Create event
      const event = await storage.createEvent({
        ...validatedData,
        organizerId: userId,
      });

      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Admin routes - Update event
  app.patch('/api/admin/events/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;

      // Check if event exists and user owns it
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (existingEvent.organizerId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this event" });
      }

      // Validate partial data
      const partialSchema = insertEventSchema.partial();
      const validatedData = partialSchema.parse(req.body);

      // Update event
      const event = await storage.updateEvent(eventId, validatedData);
      
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  // Admin routes - Delete event
  app.delete('/api/admin/events/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;

      // Check if event exists and user owns it
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (existingEvent.organizerId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this event" });
      }

      // Delete event
      await storage.deleteEvent(eventId);
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Admin routes - Get event registrations  
  app.get('/api/events/:id/registrations', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;

      // Check if event exists and user owns it
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (existingEvent.organizerId !== userId) {
        return res.status(403).json({ message: "You don't have permission to view registrations for this event" });
      }

      // Get registrations
      const registrations = await storage.getEventRegistrations(eventId);
      
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
