import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import authRoutes from "./routes/auth.js";
import mouRoutes from "./routes/mous.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();

// Security / logs
app.use(helmet());
app.use(morgan("dev"));

// Body parser (besar karena payload bisa panjang)
const jsonLimit = process.env.JSON_LIMIT || "50mb";
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonLimit }));

// CORS (kalau akses langsung ke :4000 tanpa proxy)
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

// Rate limit sederhana (dev friendly)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_PER_MIN || 120),
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Auth
app.use("/api/auth", authRoutes);

// Cek token
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// MoU routes (butuh login)
app.use("/api/mous", requireAuth, mouRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[API ERROR]", err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
