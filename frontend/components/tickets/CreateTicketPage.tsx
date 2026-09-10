"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowBackOutlined, SaveOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { LoadingState } from "@/components/common/LoadingState";
import { PageContainer } from "@/components/common/PageContainer";
import { ApiError, createTicket, getTicketFormOptions } from "@/lib/api/client";
import type { CreateTicketInput, TicketFormOptions } from "@/types/api";

function errorMessage(error: unknown, action: "load" | "create"): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return error.message;
    if (error.status === 401) return "You need to sign in before creating tickets.";
    if (error.status === 403) return "You do not have permission to create tickets.";
    if (error.status === 404) return "The tickets API endpoint was not found.";
    if (error.status && error.status >= 500) return action === "load" ? "The server could not load form options. Please try again." : "The server could not create this ticket. Please try again.";
  }
  return action === "load" ? "Unable to load ticket form options. Please check that the API is running and try again." : "Unable to create ticket. Please check your connection and try again.";
}

const initialForm: CreateTicketInput = { title: "", description: "", projectId: "", creatorId: "", assigneeId: "", priority: "MEDIUM", status: "OPEN" };

export function CreateTicketPage() {
  const router = useRouter();
  const [options, setOptions] = useState<TicketFormOptions | null>(null);
  const [form, setForm] = useState<CreateTicketInput>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadOptions = useCallback(async () => {
    try {
      const formOptions = await getTicketFormOptions();
      setOptions(formOptions);
      setForm((current) => ({ ...current, projectId: formOptions.projects[0]?.id ?? "", creatorId: formOptions.users[0]?.id ?? "" }));
    } catch (requestError) { setError(errorMessage(requestError, "load")); } finally { setLoading(false); }
  }, []);
  const reloadOptions = useCallback(async () => {
    setLoading(true); setError(null); await loadOptions();
  }, [loadOptions]);
  useEffect(() => {
    let cancelled = false;
    void getTicketFormOptions()
      .then((formOptions) => {
        if (!cancelled) {
          setOptions(formOptions);
          setForm((current) => ({ ...current, projectId: formOptions.projects[0]?.id ?? "", creatorId: formOptions.users[0]?.id ?? "" }));
        }
      })
      .catch((requestError: unknown) => { if (!cancelled) setError(errorMessage(requestError, "load")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!form.title.trim() || !form.projectId || !form.creatorId) {
      setError("Please provide a title, project, and requested-by user.");
      return;
    }
    setSubmitting(true); setError(null);
    try { await createTicket({ ...form, title: form.title.trim(), description: form.description?.trim() || undefined, assigneeId: form.assigneeId || undefined }); router.push("/tickets?created=1"); } catch (requestError) { setError(errorMessage(requestError, "create")); } finally { setSubmitting(false); }
  }

  if (loading) return <PageContainer><LoadingState label="Loading ticket form…" /></PageContainer>;
  if (error && !options) return <PageContainer><Alert action={<Button color="inherit" onClick={() => void reloadOptions()} size="small">Retry</Button>} severity="error">{error}</Alert></PageContainer>;
  if (!options) return null;
  const canCreate = options.projects.length > 0 && options.users.length > 0;

  return <PageContainer><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3.5 }}><Box><Typography variant="h4">Create ticket</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>Add an incident or service request to your team&apos;s queue.</Typography></Box><Button onClick={() => router.push("/tickets")} startIcon={<ArrowBackOutlined />} variant="text">Back to tickets</Button></Stack>
    {!canCreate && <Alert severity="warning" sx={{ mb: 2 }}>A project and at least one user are required before tickets can be created.</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Card component="form" onSubmit={(event) => void submit(event)} variant="outlined"><CardContent><Stack spacing={2.5} sx={{ maxWidth: 720 }}><TextField autoFocus disabled={!canCreate || submitting} label="Title" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required value={form.title} /><TextField disabled={!canCreate || submitting} label="Description" minRows={4} multiline onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} value={form.description} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><FormControl fullWidth required><InputLabel id="project-label">Project</InputLabel><Select disabled={!canCreate || submitting} label="Project" labelId="project-label" onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))} value={form.projectId}>{options.projects.map((project) => <MenuItem key={project.id} value={project.id}>{project.key} — {project.name}</MenuItem>)}</Select></FormControl><FormControl fullWidth><InputLabel id="priority-label">Priority</InputLabel><Select disabled={!canCreate || submitting} label="Priority" labelId="priority-label" onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as CreateTicketInput["priority"] }))} value={form.priority}><MenuItem value="LOW">Low</MenuItem><MenuItem value="MEDIUM">Medium</MenuItem><MenuItem value="HIGH">High</MenuItem><MenuItem value="CRITICAL">Critical</MenuItem></Select></FormControl></Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><FormControl fullWidth required><InputLabel id="creator-label">Requested by</InputLabel><Select disabled={!canCreate || submitting} label="Requested by" labelId="creator-label" onChange={(event) => setForm((current) => ({ ...current, creatorId: event.target.value }))} value={form.creatorId}>{options.users.map((user) => <MenuItem key={user.id} value={user.id}>{user.firstName} {user.lastName}</MenuItem>)}</Select></FormControl><FormControl fullWidth><InputLabel id="assignee-label">Assignee</InputLabel><Select disabled={!canCreate || submitting} label="Assignee" labelId="assignee-label" onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))} value={form.assigneeId ?? ""}><MenuItem value="">Unassigned</MenuItem>{options.users.map((user) => <MenuItem key={user.id} value={user.id}>{user.firstName} {user.lastName}</MenuItem>)}</Select></FormControl></Stack>
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}><Button disabled={submitting} onClick={() => router.push("/tickets")} variant="text">Cancel</Button><Button disabled={!canCreate || submitting} loading={submitting} startIcon={<SaveOutlined />} type="submit" variant="contained">Create ticket</Button></Stack></Stack></CardContent></Card>
  </PageContainer>;
}
