import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useTranslation } from "react-i18next";
import { useDevices } from "./hooks/useStorage";
import { useTheme } from "./hooks/useTheme";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { initHistoryService } from "./utils/history-service";
import { createAppTheme } from "./theme";
import Layout from "./components/Layout";
import SendPush from "./pages/SendPush";
import SpeedMode from "./pages/SpeedMode";

import { SnackbarProvider } from "notistack";

import "./i18n";
import "./App.css";

// 主应用组件内容
function AppContent() {
  const { i18n } = useTranslation();

  const {
    devices,
    loading: devicesLoading,
    addDevice,
    getDefaultDevice,
  } = useDevices();

  const { themeColor, effectiveTheme } = useTheme();

  const { appSettings, updateAppSetting } = useAppContext();

  // 初始化历史服务
  useEffect(() => {
    initHistoryService();
  }, []);
  const [windowMode] = useState(
    new URLSearchParams(window.location.search).get("mode") === "window"
  );
  // 检查是否是窗口模式并添加类名
  useEffect(() => {
    if (windowMode) {
      document.documentElement.classList.add("u-full");
    }
    return () => {
      if (windowMode) {
        document.documentElement.classList.remove("u-full");
      }
    };
  }, [windowMode]);

  // 设置data-theme属性以控制CSS样式
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  if (devicesLoading) {
    return (
      <div
        style={{
          height: "600px",
          width: "100%",
          backgroundColor: "transparent",
        }}
      ></div>
    );
  }
  // 创建动态主题
  const theme = createAppTheme(
    effectiveTheme,
    themeColor,
    i18n.language?.startsWith("zh") ? "zh" : "en",
    appSettings?.customColor
  );

  // 退出极速模式
  const handleExitSpeedMode = async () => {
    await updateAppSetting("enableSpeedMode", false);
    // window.close();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!windowMode && appSettings?.enableSpeedMode ? (
        <SpeedMode
          defaultDevice={getDefaultDevice()}
          onExitSpeedMode={handleExitSpeedMode}
        />
      ) : (
        <Layout>
          <SendPush
            devices={devices}
            defaultDevice={getDefaultDevice()}
            onAddDevice={addDevice}
          />
        </Layout>
      )}
    </ThemeProvider>
  );
}

function App() {
  return (
    <AppProvider>
      <SnackbarProvider>
        <AppContent />
      </SnackbarProvider>
    </AppProvider>
  );
}

export default App;
