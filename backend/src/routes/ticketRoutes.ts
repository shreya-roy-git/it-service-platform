import { Router } from "express";
import { createTicket, getTicketById, getTicketFormOptions, getTicketSummary, listTickets, updateTicket } from "../controllers/ticketController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const ticketRouter = Router();

ticketRouter.use(authenticate);

ticketRouter.get("/", listTickets);
ticketRouter.get("/summary", getTicketSummary);
ticketRouter.get("/form-options", getTicketFormOptions);
ticketRouter.post("/", createTicket);
ticketRouter.get("/:id", getTicketById);
ticketRouter.patch("/:id", updateTicket);

