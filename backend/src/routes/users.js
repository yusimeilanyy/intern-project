import express from "express";
import { requireAuth, isAdmin } from "../middleware/auth.js";
import { getAllUsers, registerByAdmin, deleteUser } from "../controllers/userController.js";

const router = express.Router();
router.get("/", requireAuth, isAdmin, getAllUsers);
router.post("/register", requireAuth, isAdmin, registerByAdmin);
router.delete("/:id", requireAuth, isAdmin, deleteUser);
export default router;