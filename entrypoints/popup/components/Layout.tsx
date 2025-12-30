import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";
import { useTranslation } from "react-i18next";
import { detectPlatform } from "../utils/platform";
import { useTheme } from "../hooks/useTheme";

interface LayoutProps {
  children: React.ReactNode;
  // 加密相关 props
  showEncryptionToggle?: boolean;
  encryptionEnabled?: boolean;
  onEncryptionToggle?: () => void;
}

export default function Layout({
  children,
  showEncryptionToggle = false,
  encryptionEnabled = false,
  onEncryptionToggle,
}: LayoutProps) {
  const { t } = useTranslation();
  const { themeMode, updateThemeMode } = useTheme();
  const [isWindowMode] = useState(
    new URLSearchParams(window.location.search).get("mode") === "window"
  );

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
    if (themeMode === "system") return <BrightnessAutoIcon fontSize="small" />;
    if (themeMode === "light") return <LightModeIcon fontSize="small" />;
    return <DarkModeIcon fontSize="small" />;
  };

  // 获取主题提示文字
  const getThemeTooltip = () => {
    if (themeMode === "system") return t("settings.theme.system");
    if (themeMode === "light") return t("settings.theme.light");
    return t("settings.theme.dark");
  };

  // 打开小窗口
  const handleOpenWindow = (event: React.MouseEvent) => {
    browser.windows.getCurrent((win) => {
      // macOS 窗口全屏模式会显示扩展栏，打开的小窗会自动进入全屏状态会很难看，所以不打开小窗
      const windowState = win.state || "normal";

      if (
        windowState === "fullscreen" || // 如果当前浏览器窗口是全屏状态
        isWindowMode
      ) {
        // 如果当前本身就是小窗
        return;
      }
      // 获取鼠标点击位置
      const { screenX } = event;

      // 计算窗口位置，使窗口中心对准鼠标点击位置
      const windowWidth = 380;
      const windowHeight = 660;
      const left = Math.max(0, screenX - windowWidth / 2);

      const platform = detectPlatform();
      browser.windows.create({
        url: browser.runtime.getURL("/popup.html?mode=window"),
        type: "popup",
        width: windowWidth,
        height: windowHeight,
        left: Math.round(left),
        top: platform === "unknown" ? 90 : platform === "mac" ? 120 : 90, // 如果是 Windows 则为 90，如果是 Mac 则为 120
        focused: true,
      });
      window.close();
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        minWidth: 380,
        minHeight: 600,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {/* 主要内容区域：AppBar + 内容 */}
      <Stack
        sx={{
          height: "100%",
          flex: 1,
          minHeight: 0, // 确保Stack能够正确收缩
        }}
      >
        {/* 顶部AppBar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            bgcolor: "background.paper",
            color: "text.primary",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Toolbar variant="dense" sx={{ minHeight: 48, px: 1 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontSize: "1.1rem",
                userSelect: "none",
                fontWeight: 700,
                color: "primary.main",
              }}
              onDoubleClick={handleOpenWindow}
            >
              {t("common.appName")}
            </Typography>
            {/* Appbar 的加密切换按钮 */}
            {showEncryptionToggle && (
              <Tooltip
                title={
                  encryptionEnabled
                    ? t("settings.encryption.tooltips.encryption_on")
                    : t("settings.encryption.tooltips.encryption_off")
                }
              >
                <IconButton
                  style={{ outline: "none" }}
                  onClick={onEncryptionToggle}
                  sx={{
                    color: "primary.main",
                    mr: 1,
                  }}
                  size="small"
                >
                  {encryptionEnabled ? <LockIcon /> : <LockOpenIcon />}
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title={getThemeTooltip()}>
              <IconButton
                onClick={handleThemeToggle}
                sx={{ color: "primary.main", ml: 0.5 }}
                size="small"
              >
                {getThemeIcon()}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={t("nav.settings")}>
              <IconButton
                onClick={() => {
                  browser.tabs.create({
                    url: browser.runtime.getURL("/options.html"),
                  });
                  window.close();
                }}
                sx={{ color: "primary.main", ml: 0.5 }}
                size="small"
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* 主内容区域 */}
        <Box
          sx={{
            flex: "1 1 0%",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0, // 确保内容区域能够正确收缩
            p: 0,
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
