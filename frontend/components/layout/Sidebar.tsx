"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AssessmentOutlined, DashboardOutlined, HelpOutlined, ReportProblemOutlined, SettingsOutlined } from "@mui/icons-material";
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import { useRole } from "@/hooks/useRole";

interface Item {
  label: string;
  icon: ElementType;
  href: string;
  adminOnly?: boolean;
}

const primaryItems: Item[] = [
  { label: "Dashboard", icon: DashboardOutlined, href: "/" },
  { label: "Tickets", icon: ReportProblemOutlined, href: "/tickets" },
  { label: "Reports", icon: AssessmentOutlined, href: "/reports" },
];

const secondaryItems: Item[] = [
  { label: "Help & support", icon: HelpOutlined, href: "mailto:support@example.test" },
  { label: "Settings", icon: SettingsOutlined, href: "/settings", adminOnly: true },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : !href.startsWith("mailto:") && (pathname === href || pathname.startsWith(`${href}/`));
}

function NavigationItem({ label, icon: Icon, href }: Item) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <ListItemButton component={Link} href={href} selected={active} sx={{ borderRadius: 2, mb: 0.5, py: 1.1 }}>
      <ListItemIcon sx={{ color: active ? "primary.main" : "text.secondary", minWidth: 38 }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 650 : 500 }} />
    </ListItemButton>
  );
}

export function Sidebar() {
  const { isAdministrator } = useRole();

  const visibleSecondaryItems = secondaryItems.filter((item) => !item.adminOnly || isAdministrator);

  return (
    <Stack sx={{ height: "100%", p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ height: 48, px: 1 }}>
        <Box
          sx={{
            bgcolor: "primary.main",
            borderRadius: 2,
            color: "primary.contrastText",
            display: "grid",
            height: 32,
            placeItems: "center",
            width: 32,
          }}
        >
          <ReportProblemOutlined fontSize="small" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ServiceDesk
        </Typography>
      </Stack>

      <Typography color="text.secondary" sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", mt: 4, px: 1.5 }}>
        WORKSPACE
      </Typography>

      <List disablePadding sx={{ mt: 1 }}>
        {primaryItems.map((item) => (
          <NavigationItem key={item.label} {...item} />
        ))}
      </List>

      <Box sx={{ flex: 1 }} />

      <Divider sx={{ mb: 1 }} />

      <List disablePadding>
        {visibleSecondaryItems.map((item) => (
          <NavigationItem key={item.label} {...item} />
        ))}
      </List>
    </Stack>
  );
}
