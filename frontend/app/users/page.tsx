"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  AddOutlined,
  EditOutlined,
  PeopleOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageContainer } from "@/components/common/PageContainer";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { createUser, getUsers, updateUser } from "@/lib/api/client";
import type { CreateUserInput, ManagedUser, UpdateUserInput } from "@/types/api";

const ROLES = ["Administrator", "Service Desk Analyst"] as const;

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create User Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserInput>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Service Desk Analyst",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit User Dialog State
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateUserInput>({
    firstName: "",
    lastName: "",
    email: "",
    role: "Service Desk Analyst",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const reloadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users.");
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await getUsers();
        if (!ignore) {
          setUsers(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to fetch users.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  // Create Form Handlers
  const handleOpenCreate = () => {
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "Service Desk Analyst",
    });
    setCreateErrors({});
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (!isCreating) {
      setIsCreateOpen(false);
    }
  };

  const validateCreateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!createForm.firstName.trim()) errs.firstName = "First name is required.";
    if (!createForm.lastName.trim()) errs.lastName = "Last name is required.";
    if (!createForm.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (!createForm.password) {
      errs.password = "Password is required.";
    } else if (createForm.password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }
    if (!createForm.role) errs.role = "Role is required.";

    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setIsCreating(true);
    try {
      const created = await createUser({
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      setSuccessMessage(`User "${created.firstName} ${created.lastName}" created successfully.`);
      setIsCreateOpen(false);
      await reloadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  // Edit Form Handlers
  const handleOpenEdit = (targetUser: ManagedUser) => {
    setEditingUser(targetUser);
    setEditForm({
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      email: targetUser.email,
      role: targetUser.role,
    });
    setEditErrors({});
  };

  const handleCloseEdit = () => {
    if (!isEditing) {
      setEditingUser(null);
    }
  };

  const validateEditForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!editForm.firstName?.trim()) errs.firstName = "First name is required.";
    if (!editForm.lastName?.trim()) errs.lastName = "Last name is required.";
    if (!editForm.email?.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (!editForm.role) errs.role = "Role is required.";

    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser || !validateEditForm()) return;

    setIsEditing(true);
    try {
      const updated = await updateUser(editingUser.id, {
        firstName: editForm.firstName?.trim(),
        lastName: editForm.lastName?.trim(),
        email: editForm.email?.trim(),
        role: editForm.role,
      });
      setSuccessMessage(`User "${updated.firstName} ${updated.lastName}" updated successfully.`);
      setEditingUser(null);
      await reloadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setIsEditing(false);
    }
  };

  const isSelfEdit = editingUser && currentUser?.id === editingUser.id;

  return (
    <AppLayout>
      <PageContainer>
        {/* Page Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 3.5 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              User Management
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Manage platform users, roles, and administrative access.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={handleOpenCreate}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Create user
          </Button>
        </Stack>

        {/* Global Error Banner */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Content */}
        {isLoading ? (
          <LoadingState label="Loading users..." />
        ) : users.length === 0 ? (
          <Card variant="outlined">
            <EmptyState
              title="No users found"
              description="There are currently no users in the platform."
              icon={<PeopleOutlined fontSize="large" />}
            />
          </Card>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const isCurrentUser = currentUser?.id === u.id;
                  const isAdministrator = u.role === "Administrator";

                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Typography sx={{ fontWeight: 600 }}>
                            {u.firstName} {u.lastName}
                          </Typography>
                          {isCurrentUser && (
                            <Chip
                              label="You"
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell color="text.secondary">{u.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          size="small"
                          color={isAdministrator ? "primary" : "default"}
                          variant={isAdministrator ? "filled" : "outlined"}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell color="text.secondary">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<EditOutlined fontSize="small" />}
                          onClick={() => handleOpenEdit(u)}
                          sx={{ textTransform: "none" }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create User Dialog */}
        <Dialog open={isCreateOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
          <form onSubmit={handleCreateSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>Create New User</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="First Name"
                    fullWidth
                    required
                    value={createForm.firstName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCreateForm({ ...createForm, firstName: e.target.value })
                    }
                    error={Boolean(createErrors.firstName)}
                    helperText={createErrors.firstName}
                  />
                  <TextField
                    label="Last Name"
                    fullWidth
                    required
                    value={createForm.lastName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCreateForm({ ...createForm, lastName: e.target.value })
                    }
                    error={Boolean(createErrors.lastName)}
                    helperText={createErrors.lastName}
                  />
                </Stack>

                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={createForm.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  error={Boolean(createErrors.email)}
                  helperText={createErrors.email}
                />

                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  value={createForm.password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  error={Boolean(createErrors.password)}
                  helperText={createErrors.password ?? "Minimum 6 characters."}
                />

                <FormControl fullWidth required error={Boolean(createErrors.role)}>
                  <InputLabel id="create-role-label">Role</InputLabel>
                  <Select
                    labelId="create-role-label"
                    label="Role"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                  {createErrors.role && (
                    <FormHelperText>{createErrors.role}</FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseCreate} disabled={isCreating} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" loading={isCreating}>
                Create User
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={Boolean(editingUser)} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
          <form onSubmit={handleEditSubmit}>
            <DialogTitle sx={{ fontWeight: 700 }}>Edit User</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5} sx={{ pt: 1 }}>
                {isSelfEdit && (
                  <Alert severity="info">
                    You are editing your own account. Administrators cannot remove their own Administrator role.
                  </Alert>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="First Name"
                    fullWidth
                    required
                    value={editForm.firstName ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                    error={Boolean(editErrors.firstName)}
                    helperText={editErrors.firstName}
                  />
                  <TextField
                    label="Last Name"
                    fullWidth
                    required
                    value={editForm.lastName ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                    error={Boolean(editErrors.lastName)}
                    helperText={editErrors.lastName}
                  />
                </Stack>

                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={editForm.email ?? ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  error={Boolean(editErrors.email)}
                  helperText={editErrors.email}
                />

                <FormControl fullWidth required error={Boolean(editErrors.role)}>
                  <InputLabel id="edit-role-label">Role</InputLabel>
                  <Select
                    labelId="edit-role-label"
                    label="Role"
                    value={editForm.role ?? "Service Desk Analyst"}
                    disabled={Boolean(isSelfEdit)}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                  {isSelfEdit ? (
                    <FormHelperText>Role modification disabled for self account.</FormHelperText>
                  ) : (
                    editErrors.role && <FormHelperText>{editErrors.role}</FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseEdit} disabled={isEditing} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" loading={isEditing}>
                Save Changes
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={5000}
          onClose={() => setSuccessMessage(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ width: "100%" }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </PageContainer>
    </AppLayout>
  );
}
