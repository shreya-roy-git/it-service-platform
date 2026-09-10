import { Router } from "express";
import { createUser, getUserById, listUsers, updateUser } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.use(requireRole("Administrator"));

userRouter.get("/", listUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/", createUser);
userRouter.patch("/:id", updateUser);
