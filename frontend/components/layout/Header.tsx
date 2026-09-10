"use client";

import { LogoutOutlined, Menu as MenuIcon, NotificationsNoneOutlined, SearchOutlined } from "@mui/icons-material";
import { Avatar, Badge, Box, IconButton, InputAdornment, Stack, TextField, Toolbar, Tooltip, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthContext";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "U";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "User";
  const roleName = user?.role?.name ?? "Member";

  return (
    <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: "72px !important", px: { xs: 2, sm: 3 } }}>
      <IconButton aria-label="Open navigation" edge="start" onClick={onMenuClick} sx={{ display: { lg: "none" } }}>
        <MenuIcon />
      </IconButton>

      <Box sx={{ display: { xs: "none", md: "block" }, flex: 1, maxWidth: 380 }}>
        <TextField
          fullWidth
          placeholder="Search tickets, incidents..."
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ display: { md: "none" }, flex: 1 }} />

      <Tooltip title="Notifications">
        <IconButton aria-label="Notifications">
          <Badge badgeContent={3} color="error" variant="dot">
            <NotificationsNoneOutlined />
          </Badge>
        </IconButton>
      </Tooltip>

      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Avatar sx={{ bgcolor: "primary.light", color: "primary.main", fontSize: 14, fontWeight: 700, height: 36, width: 36 }}>
          {initials}
        </Avatar>

        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <Typography variant="body2" sx={{ fontWeight: 650 }}>
            {fullName}
          </Typography>
          <Typography color="text.secondary" variant="caption" sx={{ display: "block" }}>
            {roleName}
          </Typography>
        </Box>

        <Tooltip title="Logout">
          <IconButton aria-label="Logout" onClick={() => void logout()} color="default" sx={{ ml: 0.5 }}>
            <LogoutOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Toolbar>
  );
}
