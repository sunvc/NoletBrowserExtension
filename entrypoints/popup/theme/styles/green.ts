import { ThemeOptions } from "@mui/material/styles";

// 浅色模式配色
export const lightPalette: ThemeOptions["palette"] = {
  mode: "light",
  primary: {
    main: "#16A34A", // Green 600
    light: "#4ADE80",
    dark: "#15803D",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#059669", // Emerald 600
    light: "#34D399",
    dark: "#047857",
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
    hover: "rgba(22, 163, 74, 0.04)",
    selected: "rgba(22, 163, 74, 0.08)",
  },
};

// 深色模式配色
export const darkPalette: ThemeOptions["palette"] = {
  mode: "dark",
  primary: {
    main: "#4ADE80", // Green 400
    light: "#86EFAC",
    dark: "#16A34A",
    contrastText: "#000000",
  },
  secondary: {
    main: "#34D399", // Emerald 400
    light: "#6EE7B7",
    dark: "#059669",
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
    hover: "rgba(74, 222, 128, 0.08)",
    selected: "rgba(74, 222, 128, 0.16)",
    disabledBackground: "rgba(255, 255, 255, 0.05)",
    disabled: "rgba(255, 255, 255, 0.3)",
  },
};

// 自定义颜色配置
export const customColors = {
  light: {
    gradients: {
      primary: "linear-gradient(135deg, #16A34A 0%, #4ADE80 100%)",
      secondary: "linear-gradient(135deg, #059669 0%, #34D399 100%)",
    },
    shadows: {
      primary: "0 4px 14px 0 rgba(22, 163, 74, 0.25)",
      secondary: "0 4px 14px 0 rgba(5, 150, 105, 0.25)",
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
      optionHoverBackground: "linear-gradient(145deg, #ffffff, #f0fdf4)",
      optionHoverShadow: "0 8px 16px rgba(0,0,0,0.1)",
      iconBackground: "#ffffff",
      iconShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    alert: {
      background: "rgba(22, 163, 74, 0.08)",
      color: "rgba(0, 0, 0, 0.87)",
      border: "rgba(22, 163, 74, 0.2)",
      iconColor: "#16A34A",
    },
    previewCard: {
      shadow: "0 0 6px 0 rgba(0, 0, 0, 0.01)",
      hoverShadow: "0 0 8px 0 rgba(0, 0, 0, 0.05)",
    },
    table: {
      headerBackground: "rgba(0, 0, 0, 0.02)",
    },
  },
  dark: {
    gradients: {
      primary: "linear-gradient(135deg, #4ADE80 0%, #4ADE80 100%)",
      secondary: "linear-gradient(135deg, #34D399 0%, #34D399 100%)",
    },
    shadows: {
      primary: "0 4px 14px 0 rgba(74, 222, 128, 0.15)",
      secondary: "0 4px 14px 0 rgba(52, 211, 153, 0.15)",
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
        "linear-gradient(145deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05))",
      optionHoverShadow: "0 8px 16px rgba(0,0,0,0.4)",
      iconBackground: "rgba(74, 222, 128, 0.1)",
      iconShadow: "none",
    },
    alert: {
      background: "rgba(74, 222, 128, 0.15)",
      color: "rgba(255, 255, 255, 0.9)",
      border: "rgba(74, 222, 128, 0.3)",
      iconColor: "#4ADE80",
    },
    previewCard: {
      shadow: "0 0 6px 0 rgba(0, 0, 0, 0.2)",
      hoverShadow: "0 0 8px 0 rgba(0, 0, 0, 0.4)",
    },
    table: {
      headerBackground: "rgba(255, 255, 255, 0.05)",
    },
  },
};
