"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowBackOutlined, RefreshOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { LoadingState } from "@/components/common/LoadingState";
import { PageContainer } from "@/components/common/PageContainer";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError, getTicket } from "@/lib/api/client";
import type { Ticket } from "@/types/api";
import type { TicketStatus } from "@/types/dashboard";

const statusLabel: Record<Ticket["status"], TicketStatus> = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed" };

function ticketErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return "This ticket could not be found.";
    if (error.status === 401) return "You need to sign in before viewing this ticket.";
    if (error.status === 403) return "You do not have permission to view this ticket.";
    if (error.status && error.status >= 500) return "The server could not load this ticket. Please try again.";
  }
  return "Unable to load this ticket. Please check that the API is running and try again.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function personName(person: Ticket["creator"] | Ticket["assignee"]): string {
  return person ? `${person.firstName} ${person.lastName}` : "Unassigned";
}

export function TicketDetailsPage({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadTicket = useCallback(async () => {
    try { setTicket(await getTicket(ticketId)); } catch (requestError) { setError(ticketErrorMessage(requestError)); } finally { setLoading(false); }
  }, [ticketId]);
  const reloadTicket = useCallback(async () => {
    setLoading(true); setError(null); await loadTicket();
  }, [loadTicket]);
  useEffect(() => {
    let cancelled = false;
    void getTicket(ticketId)
      .then((data) => { if (!cancelled) setTicket(data); })
      .catch((requestError: unknown) => { if (!cancelled) setError(ticketErrorMessage(requestError)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticketId]);

  if (loading && !ticket) return <PageContainer><LoadingState label="Loading ticket…" /></PageContainer>;
  if (error && !ticket) return <PageContainer><Stack spacing={2}><Button component={Link} href="/tickets" startIcon={<ArrowBackOutlined />} sx={{ alignSelf: "flex-start" }}>Back to tickets</Button><Alert action={<Button color="inherit" onClick={() => void reloadTicket()} size="small">Retry</Button>} severity="error">{error}</Alert></Stack></PageContainer>;
  if (!ticket) return null;

  return <PageContainer><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "flex-start" }} justifyContent="space-between" spacing={2} sx={{ mb: 3.5 }}><Box><Button component={Link} href="/tickets" startIcon={<ArrowBackOutlined />} size="small" sx={{ mb: 1 }}>Back to tickets</Button><Typography color="text.secondary" variant="body2">{ticket.ticketNumber}</Typography><Typography variant="h4">{ticket.title}</Typography></Box><Stack direction="row" spacing={1}><StatusChip status={statusLabel[ticket.status]} /><Chip color={ticket.priority === "CRITICAL" ? "error" : "default"} label={ticket.priority} size="small" variant="outlined" /></Stack></Stack>
    {error && <Alert action={<Button color="inherit" onClick={() => void reloadTicket()} size="small">Retry</Button>} severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
    <Grid container spacing={2.5}><Grid size={{ xs: 12, lg: 8 }}><Card variant="outlined"><CardContent><Typography variant="h6">Description</Typography><Typography color="text.secondary" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>{ticket.description || "No description provided."}</Typography></CardContent></Card></Grid><Grid size={{ xs: 12, lg: 4 }}><Card variant="outlined"><CardContent><Typography variant="h6">Ticket details</Typography><Stack divider={<Divider flexItem />} sx={{ mt: 1.5 }}>{[["Project", `${ticket.project.key} — ${ticket.project.name}`], ["Priority", ticket.priority], ["Requested by", personName(ticket.creator)], ["Assignee", personName(ticket.assignee)], ["Created", formatDate(ticket.createdAt)], ["Last updated", formatDate(ticket.updatedAt)]].map(([label, value]) => <Stack direction="row" justifyContent="space-between" key={label} spacing={2} sx={{ py: 1.25 }}><Typography color="text.secondary" variant="body2">{label}</Typography><Typography align="right" variant="body2">{value}</Typography></Stack>)}</Stack></CardContent></Card></Grid></Grid>
    <Button onClick={() => void reloadTicket()} startIcon={<RefreshOutlined />} sx={{ mt: 2 }} variant="text">Refresh ticket</Button>
  </PageContainer>;
}
