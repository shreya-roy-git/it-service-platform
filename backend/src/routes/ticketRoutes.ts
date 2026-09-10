import { Router } from "express";
import { createTicket, getTicketById, getTicketFormOptions, getTicketSummary, listTickets } from "../controllers/ticketController.js";

export const ticketRouter = Router();

ticketRouter.get("/", listTickets);
ticketRouter.get("/summary", getTicketSummary);
ticketRouter.get("/form-options", getTicketFormOptions);
ticketRouter.post("/", createTicket);
ticketRouter.get("/:id", getTicketById);
