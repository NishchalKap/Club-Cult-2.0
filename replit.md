# Club Cult - University Event Management Platform

## Overview
Club Cult is a comprehensive university event management platform that enables students to discover and register for campus events while providing club administrators with powerful tools to manage events, registrations, and analytics.

## Key Features

### For Students
- **Event Discovery**: Browse all campus events with powerful filters (date, price, type, club)
- **Quick Registration**: Register for events instantly with pre-filled forms
- **Digital Tickets**: QR code-based tickets for event check-in
- **My Tickets**: Track upcoming and past events

### For Club Admins
- **Event Creation**: Rich event creation with image upload, pricing, and capacity management
- **Registration Management**: View and manage event registrations with export functionality
- **Dashboard Analytics**: Real-time insights into event performance
- **Event Management**: Publish/draft events, edit details, track registrations

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (supports Google, GitHub, email/password)
- **Charts**: Recharts for analytics visualization
- **QR Codes**: react-qr-code for ticket generation

## Color Scheme
- Primary Purple: #7C3AED (hsl(271 81% 56%))
- Secondary Cyan: #06B6D4 (hsl(187 77% 43%))
- Accent Pink: #EC4899 (hsl(328 86% 70%))

## User Roles
- **Student**: Browse events, register, view tickets
- **Club Admin**: All student features + create/manage events, view analytics
- **Super Admin**: Full access (future enhancement)

## Database Schema

### Users
Extended from Replit Auth with: phone, branch, year, role, clubId

### Events
title, description, bannerUrl, venue, eventType, dates (registration + event), pricing, capacity, status

### Registrations
Links users to events with ticket details, QR codes, payment status

### Clubs
Club information for event organization

## API Endpoints

### Public
- GET /api/events - List published events
- GET /api/events/:id - Event details

### Authenticated
- POST /api/events/:id/register - Register for event
- GET /api/events/:id/my-registration - Check user registration
- GET /api/users/tickets - Get user's tickets
- GET /api/auth/user - Get current user

### Admin
- GET /api/admin/stats - Dashboard statistics
- GET /api/admin/events - Manage all events
- POST /api/admin/events - Create event
- PATCH /api/admin/events/:id - Update event
- DELETE /api/admin/events/:id - Delete event
- GET /api/admin/events/:id/registrations - Event registrations

## Project Structure
```
client/
  src/
    components/     # Reusable UI components
    pages/          # Page components
    hooks/          # Custom hooks (useAuth)
    lib/            # Utilities (authUtils, queryClient)
server/
  db.ts             # Database connection
  storage.ts        # Data access layer
  routes.ts         # API routes
  replitAuth.ts     # Authentication setup
shared/
  schema.ts         # Database schema & types
```

## Design Guidelines
Follow design_guidelines.md for:
- Typography (Inter font)
- Spacing (8px grid system)
- Component usage (Shadcn components)
- Color contrast and accessibility
- Responsive design patterns

## Development Notes
- Uses PostgreSQL for all data persistence
- Session storage in database for Replit Auth
- QR codes generated using ticket IDs
- Responsive design for mobile/tablet/desktop
- Form validation with Zod schemas
- Real-time data with React Query

## Future Enhancements (Phase 2)
- Payment processing with Razorpay
- Email notifications for registrations
- Bulk email to registrants
- Event analytics with funnel tracking
- Profile photo uploads
- Event waitlists
- Similar event recommendations
