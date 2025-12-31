import { ThemeOptions } from "@mui/material/styles";

// 浅色模式配色
export const lightPalette: ThemeOptions["palette"] = {
  mode: "light",
  primary: {
    main: "#2563EB", // Blue 600
    light: "#60A5FA",
    dark: "#1D4ED8",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#0284C7", // Sky 600
    light: "#38BDF8",
    dark: "#0369A1",
    contrastText: "#ffffff",
  },
  background: {
    default: "#fafafa", // Gray 50
    paper: "#ffffff",
  },
  text: {
    primary: "#111827", // Gray 900
    secondary: "#374151", // Gray 700
  },
  divider: "rgba(0, 0, 0, 0.08)",
  action: {
    hover: "rgba(37, 99, 235, 0.04)",
    selected: "rgba(37, 99, 235, 0.08)",
  },
};

// 深色模式配色
export const darkPalette: ThemeOptions["palette"] = {
  mode: "dark",
  primary: {
    main: "#60A5FA", // Blue 400
    light: "#93C5FD",
    dark: "#2563EB",
    contrastText: "#000000",
  },
  secondary: {
    main: "#38BDF8", // Sky 400
    light: "#7DD3FC",
    dark: "#0284C7",
    contrastText: "#000000",
  },
  background: {
    default: "#000000", // Pure Black
    paper: "#121212", // Material Dark
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.85)",
  },
  divider: "rgba(255, 255, 255, 0.15)",
  action: {
    hover: "rgba(96, 165, 250, 0.08)",
    selected: "rgba(96, 165, 250, 0.16)",
    disabledBackground: "rgba(255, 255, 255, 0.05)",
    disabled: "rgba(255, 255, 255, 0.3)",
  },
};

// 自定义颜色配置
export const customColors = {
  light: {
    gradients: {
      primary: "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)",
      secondary: "linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)",
    },
    shadows: {
      primary: "0 4px 14px 0 rgba(37, 99, 235, 0.25)",
      secondary: "0 4px 14px 0 rgba(2, 132, 199, 0.25)",
    },
    input: {
      background: "rgba(0, 0, 0, 0.06)",
      shadow: "inset 0 2px 6px 0 rgba(0, 0, 0, 0.12)",
      borderColor: "#0000001f",
      hoverBorderColor: "#0000004d",
      focusedBackground: "rgba(0, 0, 0, 0.08)",
    },
    paper: {
      shadow: "0 10px 40px -10px rgba(0, 0, 0, 0.1)",
    },
    button: {
      disabledBackground: "rgba(0, 0, 0, 0.12)",
      disabledText: "rgba(0, 0, 0, 0.26)",
      secondaryHover: "rgba(0, 0, 0, 0.03)",
    },
    menu: {
      background: "#fff",
      shadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      border: "1px solid rgba(0, 0, 0, 0.12)",
    },
    status: {
      success: "#4caf50",
    },
    advancedParams: {
      drawerShadow: "0px -2px 4px rgba(0,0,0,0.05)",
    },
    urlDialog: {
      optionBackground:
        "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(245,247,250,0.9))",
      optionShadow: "0 2px 8px rgba(0,0,0,0.05)",
      optionHoverBackground: "linear-gradient(145deg, #ffffff, #eff6ff)",
      optionHoverShadow: "0 8px 16px rgba(0,0,0,0.1)",
      iconBackground: "#ffffff",
      iconShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    previewCard: {
      shadow: "0 0 6px 0 rgba(0, 0, 0, 0.01)",
      hoverShadow: "0 0 8px 0 rgba(0, 0, 0, 0.05)",
    },
    table: {
      headerBackground: "rgba(0, 0, 0, 0.02)",
    },
    alert: {
      background: "rgba(37, 99, 235, 0.08)",
      color: "rgba(0, 0, 0, 0.87)",
      border: "rgba(37, 99, 235, 0.2)",
      iconColor: "#2563EB",
    },
  },
  dark: {
    gradients: {
      primary: "linear-gradient(135deg, #60A5FA 0%, #60A5FA 100%)",
      secondary: "linear-gradient(135deg, #38BDF8 0%, #38BDF8 100%)",
    },
    shadows: {
      primary: "0 4px 14px 0 rgba(96, 165, 250, 0.15)",
      secondary: "0 4px 14px 0 rgba(56, 189, 248, 0.15)",
    },
    input: {
      background: "rgba(255, 255, 255, 0.06)",
      shadow: "inset 0 2px 6px 0 rgba(0, 0, 0, 0.4)",
      borderColor: "#ffffff1f",
      hoverBorderColor: "#ffffff4d",
      focusedBackground: "#ffffff0d",
    },
    paper: {
      shadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
    },
    button: {
      disabledBackground: "rgba(255, 255, 255, 0.05)",
      disabledText: "rgba(255, 255, 255, 0.3)",
      secondaryHover: "rgba(255, 255, 255, 0.05)",
    },
    menu: {
      background: "#1E1E1E",
      shadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
    },
    status: {
      success: "#4caf50",
    },
    advancedParams: {
      drawerShadow: "0px -2px 4px rgba(0,0,0,0.2)",
    },
    urlDialog: {
      optionBackground:
        "linear-gradient(145deg, rgba(30, 30, 30, 0.9), rgba(255, 255, 255, 0.01))",
      optionShadow: "0 2px 8px rgba(0,0,0,0.2)",
      optionHoverBackground:
        "linear-gradient(145deg, rgba(96, 165, 250, 0.15), rgba(96, 165, 250, 0.05))",
      optionHoverShadow: "0 8px 16px rgba(0,0,0,0.4)",
      iconBackground: "rgba(96, 165, 250, 0.1)",
      iconShadow: "none",
    },
    previewCard: {
      shadow: "0 0 6px 0 rgba(0, 0, 0, 0.2)",
      hoverShadow: "0 0 8px 0 rgba(0, 0, 0, 0.4)",
    },
    table: {
      headerBackground: "rgba(255, 255, 255, 0.05)",
    },
    alert: {
      background: "rgba(96, 165, 250, 0.15)",
      color: "rgba(255, 255, 255, 0.9)",
      border: "rgba(96, 165, 250, 0.3)",
      iconColor: "#60A5FA",
    },
  },
};
