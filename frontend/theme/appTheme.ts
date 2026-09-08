import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: { mode: "light", primary: { main: "#2457C5", dark: "#16449F", light: "#E8EFFF" }, success: { main: "#21875C" }, warning: { main: "#B76E00" }, error: { main: "#C63342" }, background: { default: "#F5F7FB", paper: "#FFFFFF" }, text: { primary: "#172033", secondary: "#62708A" }, divider: "#E4E9F2" },
  shape: { borderRadius: 10 },
  typography: { fontFamily: 'Inter, "Segoe UI", Arial, sans-serif', h4: { fontWeight: 700, letterSpacing: "-0.02em" }, h5: { fontWeight: 700 }, subtitle1: { fontWeight: 600 }, button: { fontWeight: 600, textTransform: "none" } },
  components: { MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } }, MuiCard: { styleOverrides: { root: { boxShadow: "0 1px 2px rgba(22, 34, 58, 0.04)" } } }, MuiButton: { defaultProps: { disableElevation: true } } },
});
