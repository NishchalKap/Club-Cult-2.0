import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role?: "student" | "club_admin" | "super_admin"; token?: string };
    }
  }
}

export const checkJwt: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.auth = { userId: decoded.sub as string, role: decoded.role, token };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const checkAdminRole: RequestHandler = (req, res, next) => {
  const role = req.auth?.role;
  if (!role) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (role !== "club_admin" && role !== "super_admin") {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
};

// Simple JWT-based CSRF protection:
// For state-changing requests, require header x-csrf-token to equal HMAC(token)
export const checkCsrf: RequestHandler = (req, res, next) => {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }
  const csrfHeader = req.headers["x-csrf-token"];
  const token = req.auth?.token;
  if (!token || !csrfHeader || typeof csrfHeader !== "string") {
    return res.status(403).json({ message: "Forbidden - CSRF token missing" });
  }
  const expected = crypto.createHmac("sha256", process.env.JWT_SECRET || "secret").update(token).digest("hex");
  if (csrfHeader !== expected && csrfHeader !== token) {
    return res.status(403).json({ message: "Forbidden - Invalid CSRF token" });
  }
  next();
};


