import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTranslation } from 'react-i18next';
import { TabValue } from './types';
import { useDevices } from './hooks/useStorage';
import { useTheme } from './hooks/useTheme';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { initHistoryService } from './utils/history-service';
import { createAppTheme } from './theme';
import Layout from './components/Layout';
import SendPush from './pages/SendPush';
import History from './pages/History';
import Settings from './pages/Settings';
import SpeedMode from './pages/SpeedMode';

import { SnackbarProvider } from "notistack";

import './i18n';
import './App.css';

// 主应用组件内容
function AppContent() {
  const { i18n } = useTranslation();
  const [currentTab, setCurrentTab] = useState<TabValue>('send');
  const {
    devices,
    defaultDeviceId,
    loading: devicesLoading,
    addDevice,
    editDevice,
    removeDevice,
    setDefaultDevice,
    getDefaultDevice
  } = useDevices();

  const {
    themeMode,
    effectiveTheme,
    updateThemeMode
  } = useTheme();

  const {
    appSettings,
    toggleEncryption,
    shouldShowEncryptionToggle,
    reloadSettings,
    updateAppSetting
  } = useAppContext();

  // 初始化历史服务
  useEffect(() => {
    initHistoryService();
  }, []);
  const [windowMode,] = useState(new URLSearchParams(window.location.search).get('mode') === 'window');
  // 检查是否是窗口模式并添加类名
  useEffect(() => {
    if (windowMode) {
      document.documentElement.classList.add('u-full');
    }
    return () => {
      if (windowMode) {
        document.documentElement.classList.remove('u-full');
      }
    };
  }, [windowMode]);

  // 设置data-theme属性以控制CSS样式
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  if (devicesLoading) {
    return <div style={{ height: '600px', width: '100%', backgroundColor: 'transparent' }} >
    </div>;
  }
  // 创建动态主题
  const theme = createAppTheme(effectiveTheme, i18n.language?.startsWith('zh') ? 'zh' : 'en');

  // 退出极速模式
  const handleExitSpeedMode = async () => {
    await updateAppSetting('enableSpeedMode', false);
    // window.close();
  };

  // 渲染当前页面内容
  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'send':
        return (
          <SendPush
            devices={devices}
            defaultDevice={getDefaultDevice()}
            onAddDevice={addDevice}
          />
        );
      case 'history':
        return <History />;
      case 'settings':
        return (
          <Settings
            devices={devices}
            defaultDeviceId={defaultDeviceId}
            onAddDevice={addDevice}
            onEditDevice={editDevice}
            onRemoveDevice={removeDevice}
            onSetDefaultDevice={setDefaultDevice}
            themeMode={themeMode}
            onThemeChange={updateThemeMode}
            onSettingsChange={reloadSettings}
          />
        );
      default:
        return (
          <SendPush
            devices={devices}
            defaultDevice={getDefaultDevice()}
            onAddDevice={addDevice}
          />
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {(!windowMode && appSettings?.enableSpeedMode) ?
        <SpeedMode
          defaultDevice={getDefaultDevice()}
          onExitSpeedMode={handleExitSpeedMode}
        />
        :
        <Layout
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          showEncryptionToggle={shouldShowEncryptionToggle}
          encryptionEnabled={appSettings?.enableEncryption || false}
          onEncryptionToggle={toggleEncryption}
        >
          {renderCurrentPage()}
        </Layout>
      }
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
