"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AddOutlined, ConfirmationNumberOutlined, ErrorOutlined, PendingActionsOutlined, PriorityHighOutlined, RefreshOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { Alert, Avatar, Box, Button, Card, CardContent, Divider, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import { DashboardCard } from "@/components/common/DashboardCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageContainer } from "@/components/common/PageContainer";
import { StatusChip } from "@/components/common/StatusChip";
import { BackendStatus } from "@/components/dashboard/BackendStatus";
import { ApiError, getTicketSummary } from "@/lib/api/client";
import type { Ticket, TicketSummary } from "@/types/api";
import type { TicketStatus } from "@/types/dashboard";

const statusLabel: Record<Ticket["status"], TicketStatus> = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed" };
const statusColors = ["info.main", "warning.main", "success.main", "text.secondary"];

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function messageFor(error: unknown, resource: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "You need to sign in before viewing this resource.";
    if (error.status === 403) return "You do not have permission to view this resource.";
    if (error.status === 404) return "The requested API endpoint was not found.";
    if (error.status && error.status >= 500) return "The server could not load this resource. Please try again.";
  }
  return `Unable to load ${resource}. Please check that the API is running and try again.`;
}

export function Dashboard() {
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadSummary = useCallback(async () => {
    try { setSummary(await getTicketSummary()); } catch (requestError) { setError(messageFor(requestError, "dashboard data")); } finally { setLoading(false); }
  }, []);
  const reloadSummary = useCallback(async () => {
    setLoading(true); setError(null); await loadSummary();
  }, [loadSummary]);
  useEffect(() => {
    let cancelled = false;
    void getTicketSummary()
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((requestError: unknown) => { if (!cancelled) setError(messageFor(requestError, "dashboard data")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading && !summary) return <PageContainer><LoadingState label="Loading dashboard…" /></PageContainer>;
  if (error && !summary) return <PageContainer><Alert action={<Button color="inherit" onClick={() => void reloadSummary()} size="small">Retry</Button>} severity="error">{error}</Alert></PageContainer>;
  if (!summary) return null;
  const cards = [
    { label: "Total tickets", value: String(summary.total), helperText: "All tickets", icon: <ConfirmationNumberOutlined fontSize="small" />, accent: "#EAF0FF" },
    { label: "Open tickets", value: String(summary.open), helperText: "Requires attention", icon: <ErrorOutlined fontSize="small" />, accent: "#EDF5FF" },
    { label: "In progress", value: String(summary.inProgress), helperText: "Being actively worked", icon: <PendingActionsOutlined fontSize="small" />, accent: "#FFF5E6" },
    { label: "Critical tickets", value: String(summary.critical), helperText: "Immediate action needed", icon: <PriorityHighOutlined fontSize="small" />, accent: "#FFF0F1" },
  ];
  const overview = [["Open", summary.open], ["In Progress", summary.inProgress], ["Resolved", summary.resolved], ["Closed", summary.closed]] as const;

  return <PageContainer><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3.5 }}><Box><Typography variant="h4">Good morning, Shreya</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Here&apos;s what&apos;s happening across your service desk.</Typography><BackendStatus /></Box><Button component={Link} href="/tickets/create" startIcon={<AddOutlined />} variant="contained">Create ticket</Button></Stack>
    {error && <Alert action={<Button color="inherit" onClick={() => void reloadSummary()} size="small">Retry</Button>} severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
    <Grid container spacing={2.5}>{cards.map((card) => <Grid key={card.label} size={{ xs: 12, sm: 6, xl: 3 }}><DashboardCard {...card} /></Grid>)}</Grid>
    <Grid container spacing={2.5} sx={{ mt: 0.5 }}><Grid size={{ xs: 12, lg: 8 }}><Card variant="outlined"><CardContent sx={{ p: "0 !important" }}><Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5 }}><Box><Typography variant="h6">Recent tickets</Typography><Typography color="text.secondary" variant="body2">Latest tickets across your organization</Typography></Box><Button component={Link} href="/tickets" size="small">View all</Button></Stack><Divider />
      {summary.recent.length === 0 ? <EmptyState description="Create a ticket to begin tracking service work." title="No tickets yet" /> : summary.recent.map((ticket, index) => <Box aria-label={`View ${ticket.ticketNumber}`} component={Link} href={`/tickets/${ticket.id}`} key={ticket.id} sx={{ color: "inherit", display: "block", textDecoration: "none", "&:hover": { bgcolor: "action.hover" } }}><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={1.5} sx={{ px: 2.5, py: 2 }}><Stack direction="row" alignItems="center" spacing={1.5}><Avatar sx={{ bgcolor: "primary.light", color: "primary.main", fontSize: 11, fontWeight: 700, height: 36, width: 36 }}>{ticket.ticketNumber.slice(-2)}</Avatar><Box><Typography variant="body2" sx={{ fontWeight: 650 }}>{ticket.title}</Typography><Typography color="text.secondary" variant="caption">{ticket.ticketNumber} · Updated {formatUpdatedAt(ticket.updatedAt)}</Typography></Box></Stack><Stack direction="row" alignItems="center" spacing={1.5}><Typography color="text.secondary" variant="caption">{ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : "Unassigned"}</Typography><StatusChip status={ticket.priority === "CRITICAL" ? "Critical" : statusLabel[ticket.status]} /></Stack></Stack>{index < summary.recent.length - 1 && <Divider />}</Box>)}</CardContent></Card></Grid>
      <Grid size={{ xs: 12, lg: 4 }}><Card variant="outlined" sx={{ height: "100%" }}><CardContent><Stack direction="row" alignItems="center" justifyContent="space-between"><Box><Typography variant="h6">Ticket status overview</Typography><Typography color="text.secondary" variant="body2">Current workload distribution</Typography></Box><TrendingUpOutlined color="primary" /></Stack><Stack spacing={2.2} sx={{ mt: 3 }}>{overview.map(([label, count], index) => <Box key={label}><Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}><Typography variant="body2">{label}</Typography><Typography color="text.secondary" variant="body2">{count}</Typography></Stack><LinearProgress aria-label={`${label}: ${count} tickets`} sx={{ "& .MuiLinearProgress-bar": { bgcolor: statusColors[index] }, bgcolor: "#EEF1F6" }} value={summary.total ? (count / summary.total) * 100 : 0} variant="determinate" /></Box>)}</Stack></CardContent></Card></Grid></Grid>
    <Button onClick={() => void reloadSummary()} startIcon={<RefreshOutlined />} sx={{ mt: 2 }} variant="text">Refresh dashboard</Button>
  </PageContainer>;
}
