import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useTranslation } from "react-i18next";
import { useDevices } from "../popup/hooks/useStorage";
import { useTheme } from "../popup/hooks/useTheme";
import { AppProvider, useAppContext } from "../popup/contexts/AppContext";
import { initHistoryService } from "../popup/utils/history-service";
import { createAppTheme } from "../popup/theme";
import History from "../popup/pages/History";
import Settings from "../popup/pages/Settings";
import Legal from "../popup/pages/Legal";
import { SnackbarProvider } from "notistack";
import "../popup/i18n";
import "./App.css";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from "@mui/material";
import LanguageSelector from "../popup/components/LanguageSelector";
import GitHubIcon from "@mui/icons-material/GitHub";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";
import { openGitHub, openStoreRating } from "../popup/utils/extension";

function AppContent() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState<string>("history");

  const {
    devices,
    defaultDeviceId,
    loading: devicesLoading,
    addDevice,
    editDevice,
    removeDevice,
    setDefaultDevice,
    getDefaultDevice,
  } = useDevices();

  const {
    themeMode,
    themeColor,
    effectiveTheme,
    updateThemeMode,
    updateThemeColor,
  } = useTheme();

  // 切换主题
  const handleThemeToggle = () => {
    if (themeMode === "system") {
      updateThemeMode("light");
    } else if (themeMode === "light") {
      updateThemeMode("dark");
    } else {
      updateThemeMode("system");
    }
  };

  // 获取主题图标
  const getThemeIcon = () => {
    if (themeMode === "system") return <BrightnessAutoIcon />;
    if (themeMode === "light") return <LightModeIcon />;
    return <DarkModeIcon />;
  };

  // 获取主题提示文字
  const getThemeTooltip = () => {
    if (themeMode === "system") return t("settings.theme.system");
    if (themeMode === "light") return t("settings.theme.light");
    return t("settings.theme.dark");
  };

  const {
    appSettings,
    toggleEncryption,
    shouldShowEncryptionToggle,
    reloadSettings,
    updateAppSetting,
  } = useAppContext();

  useEffect(() => {
    initHistoryService();
    // Get page from URL
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get("page");
    if (pageParam) {
      setPage(pageParam);
    }

    // Set u-full class on html
    document.documentElement.classList.add("u-full");
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setPage(newValue);
    const url = new URL(window.location.href);
    url.searchParams.set("page", newValue);
    window.history.pushState({}, "", url.toString());
  };

  const theme = createAppTheme(
    effectiveTheme,
    themeColor,
    i18n.language?.startsWith("zh") ? "zh" : "en",
    appSettings?.customColor
  );

  // Set data-theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  if (devicesLoading) {
    return <div>Loading...</div>;
  }

  const getTitle = () => {
    if (page === "history") return t("nav.history");
    if (page === "settings") return t("nav.settings");
    if (page === "legal") return t("about.title");
    return "Nolet";
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100%",
        }}
      >
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {getTitle()}
            </Typography>
            <Tabs
              value={
                ["history", "settings", "legal"].includes(page) ? page : false
              }
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label={t("nav.history")} value="history" />
              <Tab label={t("nav.settings")} value="settings" />
              <Tab label={t("about.title")} value="legal" />
            </Tabs>
            <Box sx={{ ml: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title={getThemeTooltip()}>
                <IconButton onClick={handleThemeToggle} color="inherit">
                  {getThemeIcon()}
                </IconButton>
              </Tooltip>
              <Box sx={{ minWidth: 120 }}>
                <LanguageSelector />
              </Box>
              <Tooltip title={t("about.github.title")}>
                <IconButton onClick={openGitHub} color="inherit">
                  <GitHubIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("about.store_rating.title")}>
                <IconButton onClick={openStoreRating} color="inherit">
                  <StarBorderIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          <Container
            maxWidth="lg"
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {page === "history" && <History />}
            {page === "settings" && (
              <Settings
                devices={devices}
                defaultDeviceId={defaultDeviceId}
                onAddDevice={addDevice}
                onEditDevice={editDevice}
                onRemoveDevice={removeDevice}
                onSetDefaultDevice={setDefaultDevice}
                themeMode={themeMode}
                onThemeChange={updateThemeMode}
                themeColor={themeColor}
                onThemeColorChange={updateThemeColor}
                onSettingsChange={reloadSettings}
              />
            )}
            {page === "legal" && <Legal />}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SnackbarProvider>
        <AppContent />
      </SnackbarProvider>
    </AppProvider>
  );
}
