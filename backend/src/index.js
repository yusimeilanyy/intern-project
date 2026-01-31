// backend/src/index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from 'url';

import { pool } from './db.js';
import authRoutes from "./routes/auth.js";
import mousRoutes from "./routes/mous.js";
import usersRoutes from './routes/users.js';
import { requireAuth } from "./middleware/auth.js";
import { getDashboardData } from "./controllers/mousController.js";  // ✅ Import langsung dari controller
import { setupReminderJobs } from './jobs/reminderJob.js';
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Setup reminder jobs

// Security / logs
app.use(helmet());
app.use(morgan("dev"));

// Body parser
const jsonLimit = process.env.JSON_LIMIT || "50mb";
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonLimit }));

// CORS
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limit
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_PER_MIN || 120),
  })
);

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Check token
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ✅ Dashboard route - langsung dari controller
app.get("/api/dashboard", requireAuth, getDashboardData);

// MoU routes
app.use("/api/mous", requireAuth, mousRoutes);

// Users routes
app.use("/api/users", requireAuth, usersRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route tidak ditemukan" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("[API ERROR]", err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

const port = Number(process.env.PORT || 4001);
setupReminderJobs();
app.listen(port, () => {
  console.log(`✅ API running on http://localhost:${port}`);
  console.log(`✅ Health check: http://localhost:${port}/api/health`);
});