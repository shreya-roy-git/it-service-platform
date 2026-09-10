"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AddOutlined, SearchOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageContainer } from "@/components/common/PageContainer";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError, getTicketFormOptions, getTickets } from "@/lib/api/client";
import type { Person, Project, Ticket, TicketPriority, TicketStatus } from "@/types/api";
import type { TicketStatus as DashboardTicketStatus } from "@/types/dashboard";

const statusLabel: Record<TicketStatus, DashboardTicketStatus> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

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

type SortField = "createdAt" | "updatedAt" | "priority" | "status" | "ticketNumber";

export function TicketsPage({ created }: { created: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form options for filters
  const [usersOptions, setUsersOptions] = useState<Person[]>([]);
  const [projectsOptions, setProjectsOptions] = useState<Project[]>([]);

  // Filter & Search state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | TicketPriority>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<"ALL" | string>("ALL");
  const [projectFilter, setProjectFilter] = useState<"ALL" | string>("ALL");

  // Pagination & Sort state
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load form options (users, projects) once on mount
  useEffect(() => {
    void getTicketFormOptions()
      .then((opts) => {
        setUsersOptions(opts.users);
        setProjectsOptions(opts.projects);
      })
      .catch(() => {
        // Ignore fallback
      });
  }, []);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page to 1 whenever any filter or search changes
  const resetPageAndFilterChange = useCallback(() => {
    setPage(1);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    resetPageAndFilterChange();
  };

  const handleStatusChange = (val: "ALL" | TicketStatus) => {
    setStatusFilter(val);
    resetPageAndFilterChange();
  };

  const handlePriorityChange = (val: "ALL" | TicketPriority) => {
    setPriorityFilter(val);
    resetPageAndFilterChange();
  };

  const handleAssigneeChange = (val: "ALL" | string) => {
    setAssigneeFilter(val);
    resetPageAndFilterChange();
  };

  const handleProjectChange = (val: "ALL" | string) => {
    setProjectFilter(val);
    resetPageAndFilterChange();
  };

  // Fetch tickets from backend whenever query parameters change
  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (active) {
        setLoading(true);
        setError(null);
      }
    });

    getTickets({
      search: debouncedSearch || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      priority: priorityFilter === "ALL" ? undefined : priorityFilter,
      assigneeId: assigneeFilter === "ALL" ? undefined : assigneeFilter,
      projectId: projectFilter === "ALL" ? undefined : projectFilter,
      page,
      limit: 10,
      sortBy,
      sortOrder,
    })
      .then((res) => {
        if (active) {
          setTickets(res.data);
          setPagination(res.pagination);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, statusFilter, priorityFilter, assigneeFilter, projectFilter, page, sortBy, sortOrder]);

  const reloadTickets = () => {
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const filtersActive = useMemo(() => {
    return Boolean(searchInput.trim()) || statusFilter !== "ALL" || priorityFilter !== "ALL" || assigneeFilter !== "ALL" || projectFilter !== "ALL";
  }, [searchInput, statusFilter, priorityFilter, assigneeFilter, projectFilter]);

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
    setProjectFilter("ALL");
    setPage(1);
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  return (
    <PageContainer>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3.5 }}
      >
        <Box>
          <Typography variant="h4">Tickets</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Track service requests and incidents across your organization.
          </Typography>
        </Box>

        <Button component={Link} href="/tickets/create" startIcon={<AddOutlined />} variant="contained">
          Create ticket
        </Button>
      </Stack>

      {created && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Ticket created successfully.
        </Alert>
      )}

      {error ? (
        <Alert
          action={
            <Button color="inherit" onClick={reloadTickets} size="small">
              Retry
            </Button>
          }
          severity="error"
        >
          {error}
        </Alert>
      ) : (
        <Card variant="outlined">
          <CardContent>
            {/* Filter controls row */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2.5 }} flexWrap="wrap" useFlexGap>
              <TextField
                sx={{ flex: { md: 1 }, minWidth: { xs: "100%", md: 240 } }}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search ticket number, title, description..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                value={searchInput}
                size="small"
              />

              <Select
                aria-label="Filter tickets by status"
                onChange={(event) => handleStatusChange(event.target.value as "ALL" | TicketStatus)}
                size="small"
                value={statusFilter}
                sx={{ minWidth: { xs: "100%", sm: 150 } }}
              >
                <MenuItem value="ALL">All statuses</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </Select>

              <Select
                aria-label="Filter tickets by priority"
                onChange={(event) => handlePriorityChange(event.target.value as "ALL" | TicketPriority)}
                size="small"
                value={priorityFilter}
                sx={{ minWidth: { xs: "100%", sm: 150 } }}
              >
                <MenuItem value="ALL">All priorities</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </Select>

              <Select
                aria-label="Filter tickets by assignee"
                onChange={(event) => handleAssigneeChange(event.target.value)}
                size="small"
                value={assigneeFilter}
                sx={{ minWidth: { xs: "100%", sm: 160 } }}
              >
                <MenuItem value="ALL">All assignees</MenuItem>
                {usersOptions.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>

              <Select
                aria-label="Filter tickets by project"
                onChange={(event) => handleProjectChange(event.target.value)}
                size="small"
                value={projectFilter}
                sx={{ minWidth: { xs: "100%", sm: 160 } }}
              >
                <MenuItem value="ALL">All projects</MenuItem>
                {projectsOptions.map((proj) => (
                  <MenuItem key={proj.id} value={proj.id}>
                    {proj.key} — {proj.name}
                  </MenuItem>
                ))}
              </Select>

              <Button disabled={!filtersActive} onClick={clearFilters} variant="text" sx={{ px: 2 }}>
                Clear filters
              </Button>
            </Stack>

            {loading ? (
              <LoadingState label="Loading tickets…" />
            ) : tickets.length === 0 ? (
              <Stack alignItems="center">
                <EmptyState
                  title={filtersActive ? "No matching tickets" : "No tickets yet"}
                  description={
                    filtersActive
                      ? "Try adjusting your search terms or filters."
                      : "Create your first ticket to start tracking service work."
                  }
                />
                {filtersActive && (
                  <Button variant="outlined" size="small" onClick={clearFilters} sx={{ mb: 4 }}>
                    Clear filters
                  </Button>
                )}
              </Stack>
            ) : (
              <>
                <Box sx={{ overflowX: "auto" }}>
                  <Table aria-label="Tickets">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === "ticketNumber"}
                            direction={sortBy === "ticketNumber" ? sortOrder : "asc"}
                            onClick={() => handleSort("ticketNumber")}
                          >
                            Ticket
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === "status"}
                            direction={sortBy === "status" ? sortOrder : "asc"}
                            onClick={() => handleSort("status")}
                          >
                            Status
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === "priority"}
                            direction={sortBy === "priority" ? sortOrder : "asc"}
                            onClick={() => handleSort("priority")}
                          >
                            Priority
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Assignee</TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === "createdAt"}
                            direction={sortBy === "createdAt" ? sortOrder : "asc"}
                            onClick={() => handleSort("createdAt")}
                          >
                            Created
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow hover key={ticket.id}>
                          <TableCell>
                            <Box
                              component={Link}
                              href={`/tickets/${ticket.id}`}
                              sx={{ color: "inherit", display: "block", textDecoration: "none" }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {ticket.ticketNumber}
                              </Typography>
                              <Typography color="text.secondary" variant="body2">
                                {ticket.title}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{ticket.project.name}</TableCell>
                          <TableCell>
                            <StatusChip status={statusLabel[ticket.status]} />
                          </TableCell>
                          <TableCell>{ticket.priority}</TableCell>
                          <TableCell>
                            {ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : "Unassigned"}
                          </TableCell>
                          <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                {/* Pagination Footer */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}
                >
                  <Typography color="text.secondary" variant="body2">
                    Showing page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total tickets)
                  </Typography>

                  <Pagination
                    count={pagination.totalPages || 1}
                    page={pagination.page}
                    onChange={(_event, value) => setPage(value)}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                  />
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
