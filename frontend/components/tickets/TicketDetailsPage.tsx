"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowBackOutlined, CancelOutlined, EditOutlined, RefreshOutlined, SaveOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingState } from "@/components/common/LoadingState";
import { PageContainer } from "@/components/common/PageContainer";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError, getTicket, getTicketFormOptions, updateTicket } from "@/lib/api/client";
import type { Person, Ticket, TicketPriority, TicketStatus } from "@/types/api";
import type { TicketStatus as DashboardTicketStatus } from "@/types/dashboard";

const statusLabel: Record<TicketStatus, DashboardTicketStatus> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const priorityOptions: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

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

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<TicketStatus>("OPEN");
  const [editPriority, setEditPriority] = useState<TicketPriority>("MEDIUM");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [usersOptions, setUsersOptions] = useState<Person[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    try {
      setTicket(await getTicket(ticketId));
    } catch (requestError) {
      setError(ticketErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const reloadTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaveSuccess(null);
    await loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    let cancelled = false;
    void getTicket(ticketId)
      .then((data) => {
        if (!cancelled) setTicket(data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(ticketErrorMessage(requestError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const startEditing = async () => {
    if (!ticket) return;
    setEditTitle(ticket.title);
    setEditDescription(ticket.description || "");
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditAssigneeId(ticket.assignee?.id || "");
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditing(true);

    if (usersOptions.length === 0) {
      try {
        const options = await getTicketFormOptions();
        setUsersOptions(options.users);
      } catch {
        // Fallback: keep existing options empty if fetch fails
      }
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    if (!editTitle.trim()) {
      setSaveError("Title is required.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updated = await updateTicket(ticket.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        status: editStatus,
        priority: editPriority,
        assigneeId: editAssigneeId || null,
      });

      setTicket(updated);
      setSaveSuccess("Ticket updated successfully.");
      setIsEditing(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError("Failed to update ticket. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !ticket) return <PageContainer><LoadingState label="Loading ticket…" /></PageContainer>;
  if (error && !ticket) return <PageContainer><Stack spacing={2}><Button component={Link} href="/tickets" startIcon={<ArrowBackOutlined />} sx={{ alignSelf: "flex-start" }}>Back to tickets</Button><Alert action={<Button color="inherit" onClick={() => void reloadTicket()} size="small">Retry</Button>} severity="error">{error}</Alert></Stack></PageContainer>;
  if (!ticket) return null;

  return (
    <PageContainer>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "flex-start" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3.5 }}
      >
        <Box>
          <Button component={Link} href="/tickets" startIcon={<ArrowBackOutlined />} size="small" sx={{ mb: 1 }}>
            Back to tickets
          </Button>
          <Typography color="text.secondary" variant="body2">
            {ticket.ticketNumber}
          </Typography>
          <Typography variant="h4">{ticket.title}</Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <StatusChip status={statusLabel[ticket.status]} />
          <Chip
            color={ticket.priority === "CRITICAL" ? "error" : "default"}
            label={ticket.priority}
            size="small"
            variant="outlined"
          />
          {!isEditing ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<EditOutlined />}
              onClick={() => void startEditing()}
              sx={{ ml: 1, borderRadius: 2 }}
            >
              Edit Ticket
            </Button>
          ) : (
            <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<CancelOutlined />}
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
                onClick={(e) => void handleSave(e)}
                disabled={saving || !editTitle.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Stack>
          )}
        </Stack>
      </Stack>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(null)}>
          {saveSuccess}
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      {error && (
        <Alert action={<Button color="inherit" onClick={() => void reloadTicket()} size="small">Retry</Button>} severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isEditing ? (
        <Card variant="outlined" component="form" onSubmit={(e) => void handleSave(e)} sx={{ p: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2.5 }}>
              Edit Ticket Information
            </Typography>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  disabled={saving}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                  disabled={saving}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Priority"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TicketPriority)}
                  disabled={saving}
                >
                  {priorityOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  select
                  label="Assignee"
                  value={editAssigneeId}
                  onChange={(e) => setEditAssigneeId(e.target.value)}
                  disabled={saving}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {usersOptions.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={saving}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" color="inherit" onClick={cancelEditing} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
                disabled={saving || !editTitle.trim()}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">Description</Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>
                  {ticket.description || "No description provided."}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">Ticket details</Typography>
                <Stack divider={<Divider flexItem />} sx={{ mt: 1.5 }}>
                  {[
                    ["Project", `${ticket.project.key} — ${ticket.project.name}`],
                    ["Priority", ticket.priority],
                    ["Requested by", personName(ticket.creator)],
                    ["Assignee", personName(ticket.assignee)],
                    ["Created", formatDate(ticket.createdAt)],
                    ["Last updated", formatDate(ticket.updatedAt)],
                  ].map(([label, value]) => (
                    <Stack direction="row" justifyContent="space-between" key={label} spacing={2} sx={{ py: 1.25 }}>
                      <Typography color="text.secondary" variant="body2">
                        {label}
                      </Typography>
                      <Typography align="right" variant="body2">
                        {value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Button onClick={() => void reloadTicket()} startIcon={<RefreshOutlined />} sx={{ mt: 2 }} variant="text">
        Refresh ticket
      </Button>
    </PageContainer>
  );
}
