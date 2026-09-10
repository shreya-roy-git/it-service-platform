"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AddOutlined, SearchOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, InputAdornment, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageContainer } from "@/components/common/PageContainer";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError, getTickets } from "@/lib/api/client";
import type { Ticket } from "@/types/api";
import type { TicketStatus } from "@/types/dashboard";

const statusLabel: Record<Ticket["status"], TicketStatus> = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed" };

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "You need to sign in before viewing tickets.";
    if (error.status === 403) return "You do not have permission to view tickets.";
    if (error.status === 404) return "The tickets API endpoint was not found.";
    if (error.status && error.status >= 500) return "The server could not load tickets. Please try again.";
  }
  return "Unable to load tickets. Please check that the API is running and try again.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function TicketsPage({ created }: { created: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | Ticket["status"]>("ALL");
  const [priority, setPriority] = useState<"ALL" | Ticket["priority"]>("ALL");
  const loadTickets = useCallback(async () => {
    try { setTickets(await getTickets()); } catch (requestError) { setError(errorMessage(requestError)); } finally { setLoading(false); }
  }, []);
  const reloadTickets = useCallback(async () => {
    setLoading(true); setError(null); await loadTickets();
  }, [loadTickets]);
  useEffect(() => {
    let cancelled = false;
    void getTickets()
      .then((data) => { if (!cancelled) setTickets(data); })
      .catch((requestError: unknown) => { if (!cancelled) setError(errorMessage(requestError)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    const searchText = `${ticket.ticketNumber} ${ticket.title}`.toLowerCase();
    return (status === "ALL" || ticket.status === status)
      && (priority === "ALL" || ticket.priority === priority)
      && searchText.includes(query.trim().toLowerCase());
  }), [priority, query, status, tickets]);
  const filtersActive = Boolean(query) || status !== "ALL" || priority !== "ALL";
  const clearFilters = (): void => { setQuery(""); setStatus("ALL"); setPriority("ALL"); };

  return <PageContainer><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3.5 }}><Box><Typography variant="h4">Tickets</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Track service requests and incidents across your organization.</Typography></Box><Button component={Link} href="/tickets/create" startIcon={<AddOutlined />} variant="contained">Create ticket</Button></Stack>
    {created && <Alert severity="success" sx={{ mb: 2 }}>Ticket created successfully.</Alert>}
    {loading ? <LoadingState label="Loading tickets…" /> : error ? <Alert action={<Button color="inherit" onClick={() => void reloadTickets()} size="small">Retry</Button>} severity="error">{error}</Alert> : tickets.length === 0 ? <Card variant="outlined"><EmptyState description="Create your first ticket to start tracking service work." title="No tickets yet" /></Card> : <Card variant="outlined"><CardContent><Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2.5 }}><TextField fullWidth onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket number or title" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }} value={query} /><Select aria-label="Filter tickets by status" onChange={(event) => setStatus(event.target.value as "ALL" | Ticket["status"])} size="small" value={status} sx={{ minWidth: { md: 170 } }}><MenuItem value="ALL">All statuses</MenuItem><MenuItem value="OPEN">Open</MenuItem><MenuItem value="IN_PROGRESS">In progress</MenuItem><MenuItem value="RESOLVED">Resolved</MenuItem><MenuItem value="CLOSED">Closed</MenuItem></Select><Select aria-label="Filter tickets by priority" onChange={(event) => setPriority(event.target.value as "ALL" | Ticket["priority"])} size="small" value={priority} sx={{ minWidth: { md: 170 } }}><MenuItem value="ALL">All priorities</MenuItem><MenuItem value="LOW">Low</MenuItem><MenuItem value="MEDIUM">Medium</MenuItem><MenuItem value="HIGH">High</MenuItem><MenuItem value="CRITICAL">Critical</MenuItem></Select><Button disabled={!filtersActive} onClick={clearFilters} variant="text">Clear filters</Button></Stack>
      {filteredTickets.length === 0 ? <EmptyState description="Try a different search term or filter." title="No matching tickets" /> : <Box sx={{ overflowX: "auto" }}><Table aria-label="Tickets"><TableHead><TableRow><TableCell>Ticket</TableCell><TableCell>Project</TableCell><TableCell>Status</TableCell><TableCell>Priority</TableCell><TableCell>Assignee</TableCell><TableCell>Created</TableCell></TableRow></TableHead><TableBody>{filteredTickets.map((ticket) => <TableRow hover key={ticket.id}><TableCell><Box component={Link} href={`/tickets/${ticket.id}`} sx={{ color: "inherit", display: "block", textDecoration: "none" }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{ticket.ticketNumber}</Typography><Typography color="text.secondary" variant="body2">{ticket.title}</Typography></Box></TableCell><TableCell>{ticket.project.name}</TableCell><TableCell><StatusChip status={statusLabel[ticket.status]} /></TableCell><TableCell>{ticket.priority}</TableCell><TableCell>{ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : "Unassigned"}</TableCell><TableCell>{formatDate(ticket.createdAt)}</TableCell></TableRow>)}</TableBody></Table></Box>}</CardContent></Card>}
  </PageContainer>;
}
