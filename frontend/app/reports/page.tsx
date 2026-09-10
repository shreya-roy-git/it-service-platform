import { AssessmentOutlined } from "@mui/icons-material";
import { Card, Typography } from "@mui/material";
import { EmptyState } from "@/components/common/EmptyState";
import { PageContainer } from "@/components/common/PageContainer";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ReportsPage() {
  return <AppLayout><PageContainer><Typography variant="h4">Reports</Typography><Typography color="text.secondary" sx={{ mb: 3.5, mt: 0.5 }}>Review service desk trends and outcomes.</Typography><Card variant="outlined"><EmptyState description="Reporting will become available when the backend exposes reporting data." icon={<AssessmentOutlined fontSize="large" />} title="No reports available" /></Card></PageContainer></AppLayout>;
}
