import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import mousRoutes from "./routes/mous.js";
import renewalRoutes from "./routes/renewalRoutes.js"; 
import { requireAuth } from "./middleware/auth.js";
import { getDashboardData } from "./controllers/mousController.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/mous", mousRoutes);

app.get("/api/dashboard", requireAuth, getDashboardData);

app.use("/api/renewal", renewalRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
