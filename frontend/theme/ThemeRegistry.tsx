"use client";

import type { ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { appTheme } from "@/theme/appTheme";

export function ThemeRegistry({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={appTheme}><CssBaseline />{children}</ThemeProvider>;
}
