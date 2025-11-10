import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { checkJwt, checkAdminRole, checkCsrf } from "./authMiddleware";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertEventSchema, insertRegistrationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes - JWT + password
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body as { email: string; password: string; firstName?: string; lastName?: string };
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.upsertUser({
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        passwordHash,
        role: "student",
      } as any);
      const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
      res.json({ token });
    } catch (error) {
      console.error("Error signing up:", error);
      res.status(500).json({ message: "Failed to sign up" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
      res.json({ token });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.get('/api/auth/me', checkJwt, async (req, res) => {
    try {
      const user = await storage.getUser(req.auth!.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching me:", error);
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
  app.get('/api/events/:id/my-registration', checkJwt, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const eventId = req.params.id;
      const registration = await storage.getUserEventRegistration(userId, eventId);
      res.json(registration);
    } catch (error) {
      console.error("Error checking registration:", error);
      res.status(500).json({ message: "Failed to check registration" });
    }
  });

  // Register for event
  app.post('/api/events/:id/register', checkJwt, checkCsrf, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
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
  app.get('/api/users/tickets', checkJwt, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const tickets = await storage.getUserRegistrations(userId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Admin routes - Get dashboard stats
  app.get('/api/admin/stats', checkJwt, checkAdminRole, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const stats = await storage.getAdminStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin routes - Get all events by organizer
  app.get('/api/admin/events', checkJwt, checkAdminRole, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      const events = await storage.getEventsByOrganizer(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching admin events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Admin routes - Create event
  app.post('/api/admin/events', checkJwt, checkAdminRole, checkCsrf, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
      
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
  app.patch('/api/admin/events/:id', checkJwt, checkAdminRole, checkCsrf, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
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
  app.delete('/api/admin/events/:id', checkJwt, checkAdminRole, checkCsrf, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
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
  app.get('/api/events/:id/registrations', checkJwt, checkAdminRole, async (req: any, res) => {
    try {
      const userId = req.auth.userId;
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
