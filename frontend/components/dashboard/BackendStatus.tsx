"use client";

import { useEffect, useState } from "react";
import { CheckCircleOutline, ErrorOutline, RefreshOutlined } from "@mui/icons-material";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { getHealthStatus } from "@/lib/api/client";

type ConnectionState = "checking" | "available" | "unavailable";

export function BackendStatus() {
  const [status, setStatus] = useState<ConnectionState>("checking");

  async function checkBackend(): Promise<void> {
    setStatus("checking");
    try {
      await getHealthStatus();
      setStatus("available");
    } catch {
      setStatus("unavailable");
    }
  }

  useEffect(() => {
    let isMounted = true;
    getHealthStatus()
      .then(() => {
        if (isMounted) {
          setStatus("available");
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus("unavailable");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const details = status === "available"
    ? { color: "success.main", icon: <CheckCircleOutline fontSize="small" />, label: "API connected" }
    : status === "unavailable"
      ? { color: "error.main", icon: <ErrorOutline fontSize="small" />, label: "API unavailable" }
      : { color: "text.secondary", icon: <RefreshOutlined fontSize="small" />, label: "Checking API" };

  return <Stack direction="row" alignItems="center" spacing={0.5}><Stack color={details.color} direction="row" alignItems="center" spacing={0.5}>{details.icon}<Typography variant="caption">{details.label}</Typography></Stack><Tooltip title="Check API connection"><IconButton aria-label="Check API connection" onClick={() => void checkBackend()} size="small"><RefreshOutlined fontSize="small" /></IconButton></Tooltip></Stack>;
}
