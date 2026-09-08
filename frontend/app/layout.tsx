import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import "./globals.css";
import { ThemeRegistry } from "@/theme/ThemeRegistry";

export const metadata: Metadata = { title: "ServiceDesk | IT Service Management", description: "IT service and incident management workspace" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body><AppRouterCacheProvider options={{ enableCssLayer: true }}><ThemeRegistry>{children}</ThemeRegistry></AppRouterCacheProvider></body></html>;
}
