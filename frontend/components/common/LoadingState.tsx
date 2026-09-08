import { CircularProgress, Stack, Typography } from "@mui/material";
export function LoadingState({ label = "Loading workspace…" }: { label?: string }) { return <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 240 }}><CircularProgress size={28} /><Typography color="text.secondary" variant="body2">{label}</Typography></Stack>; }
