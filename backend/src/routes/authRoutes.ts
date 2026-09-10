import { Router } from "express";
import { getCurrentUser, login, logout } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/me", authenticate, requireRole("Administrator", "Service Desk Analyst"), getCurrentUser);
authRouter.post("/logout", authenticate, requireRole("Administrator", "Service Desk Analyst"), logout);
