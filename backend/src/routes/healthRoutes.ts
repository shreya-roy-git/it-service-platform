import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

export const healthRouter = Router();

healthRouter.get("/health", getHealth);
healthRouter.get("/admin-only", authenticate, requireRole("Administrator"), (_req, res) => {
  res.status(200).json({ success: true, message: "Admin access granted." });
});
