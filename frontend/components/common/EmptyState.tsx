import type { ReactNode } from "react";
import { InboxOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
interface Props { title: string; description: string; icon?: ReactNode; }
export function EmptyState({ title, description, icon = <InboxOutlined fontSize="large" /> }: Props) { return <Stack alignItems="center" color="text.secondary" spacing={1.5} sx={{ py: 6, textAlign: "center" }}>{icon}<Typography color="text.primary" variant="subtitle1">{title}</Typography><Typography variant="body2">{description}</Typography></Stack>; }
