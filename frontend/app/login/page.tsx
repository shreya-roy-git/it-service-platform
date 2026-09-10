"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { ReportProblemOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      // Redirect handled by ProtectedRoute / AuthContext update
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Card elevation={1} sx={{ borderRadius: 3, p: 1 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={3} alignItems="center" component="form" onSubmit={handleSubmit}>
              <Stack alignItems="center" spacing={1.5} sx={{ textAlign: "center", width: "100%" }}>
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    borderRadius: 2,
                    color: "primary.contrastText",
                    display: "grid",
                    height: 48,
                    placeItems: "center",
                    width: 48,
                  }}
                >
                  <ReportProblemOutlined fontSize="medium" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  ServiceDesk
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Sign in to access your IT Service Platform workspace
                </Typography>
              </Stack>

              {error && (
                <Alert severity="error" sx={{ width: "100%" }}>
                  {error}
                </Alert>
              )}

              <Stack spacing={2} sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="email"
                  autoFocus
                  placeholder="manager@example.test"
                />

                <TextField
                  fullWidth
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />

                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !email.trim() || !password}
                  sx={{ py: 1.25, fontWeight: 650, borderRadius: 2 }}
                >
                  {isSubmitting ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={20} color="inherit" />
                      <span>Signing in...</span>
                    </Stack>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
