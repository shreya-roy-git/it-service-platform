import type { ReactNode } from "react";
import { Box } from "@mui/material";
export function PageContainer({ children }: { children: ReactNode }) { return <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3, lg: 4 } }}>{children}</Box>; }
