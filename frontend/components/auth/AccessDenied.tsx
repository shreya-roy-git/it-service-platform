"use client";

import Link from "next/link";
import { AdminPanelSettingsOutlined, ArrowBackOutlined } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { PageContainer } from "@/components/common/PageContainer";

export function AccessDenied() {
  return (
    <PageContainer>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Card variant="outlined" sx={{ maxWidth: 480, width: "100%", p: 2, textAlign: "center", borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2.5} alignItems="center">
              <Box
                sx={{
                  bgcolor: "error.light",
                  color: "error.main",
                  borderRadius: "50%",
                  display: "grid",
                  height: 64,
                  placeItems: "center",
                  width: 64,
                }}
              >
                <AdminPanelSettingsOutlined sx={{ fontSize: 36 }} />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                403 — Access Denied
              </Typography>

              <Typography color="text.secondary" variant="body2">
                You do not have the required permissions to access this area. Administrator permissions are required.
              </Typography>

              <Button component={Link} href="/" variant="contained" startIcon={<ArrowBackOutlined />} sx={{ mt: 1, borderRadius: 2 }}>
                Return to Dashboard
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
