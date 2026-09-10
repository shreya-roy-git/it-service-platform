import { SettingsOutlined } from "@mui/icons-material";
import { Card, Typography } from "@mui/material";
import { EmptyState } from "@/components/common/EmptyState";
import { PageContainer } from "@/components/common/PageContainer";
import { AppLayout } from "@/components/layout/AppLayout";

export default function SettingsPage() {
  return <AppLayout><PageContainer><Typography variant="h4">Settings</Typography><Typography color="text.secondary" sx={{ mb: 3.5, mt: 0.5 }}>Manage workspace preferences and service desk configuration.</Typography><Card variant="outlined"><EmptyState description="Settings management is not available until the backend exposes configuration APIs." icon={<SettingsOutlined fontSize="large" />} title="No settings available" /></Card></PageContainer></AppLayout>;
}
