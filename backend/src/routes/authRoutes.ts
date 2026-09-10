import { Router } from "express";
import { getCurrentUser, login, logout } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/me", authenticate, getCurrentUser);
authRouter.post("/logout", authenticate, logout);
