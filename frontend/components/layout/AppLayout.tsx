"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { AppBar, Box, Drawer } from "@mui/material";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
const drawerWidth = 252;
export function AppLayout({ children }: { children: ReactNode }) { const [mobileOpen, setMobileOpen] = useState(false); const navigation = <Sidebar />; return <Box sx={{ bgcolor: "background.default", display: "flex", minHeight: "100vh" }}><Box component="nav" sx={{ flexShrink: { lg: 0 }, width: { lg: drawerWidth } }}><Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} slotProps={{ paper: { sx: { width: drawerWidth } } }} sx={{ display: { lg: "none" } }} variant="temporary">{navigation}</Drawer><Drawer open variant="permanent" slotProps={{ paper: { sx: { borderColor: "divider", borderRight: 1, boxSizing: "border-box", width: drawerWidth } } }} sx={{ "& .MuiDrawer-paper": { width: drawerWidth }, display: { xs: "none", lg: "block" } }}>{navigation}</Drawer></Box><Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}><AppBar color="inherit" elevation={0} position="sticky" sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}><Header onMenuClick={() => setMobileOpen(true)} /></AppBar>{children}</Box></Box>; }
